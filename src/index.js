import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { loadConfig } from "./config.js";
import { capturePage } from "./capture.js";
import { compareImages } from "./diff-engine.js";
import { compareSeoMetadata } from "./dom-seo-scanner.js";
import { compareComputedStyles } from "./css-inspector.js";
import { crawlSiteRoutes, fetchSitemapUrls } from "./sitemap-crawler.js";
import { generateHtmlReport } from "./reporter.js";

/**
 * Execute full visual, CSS and SEO parity scan
 */
export async function runParityScan(options = {}) {
  let config;
  if (typeof options === "string") {
    config = loadConfig(options);
  } else if (options.configPath) {
    config = { ...loadConfig(options.configPath), ...options };
  } else {
    config = { ...loadConfig(null), ...options };
  }

  const outputDir = path.resolve(process.cwd(), config.outputDir || "./parity-report");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // Auto-discover routes via sitemap or crawler if requested
  if (config.sitemapUrl) {
    console.log(`📡 Auto-discovering routes from sitemap: ${config.sitemapUrl}...`);
    const sitemapUrls = await fetchSitemapUrls(config.sitemapUrl, config.maxPages || 50);
    const baseOrigin = new URL(config.baselineBaseUrl).origin;
    config.routes = sitemapUrls.map((u) => {
      const pathname = new URL(u, baseOrigin).pathname;
      return {
        name: pathname === "/" ? "Homepage" : pathname.replace(/^\//, "").replace(/\/$/, ""),
        path: pathname,
        baselinePath: pathname
      };
    });
  } else if (config.crawl) {
    console.log(`🕷️ Auto-crawling routes starting from: ${config.baselineBaseUrl}...`);
    config.routes = await crawlSiteRoutes(browser, config.baselineBaseUrl, config.maxPages || 30);
  }

  console.log(`\n🚀 Initializing Web Parity Kit...`);
  console.log(`   Baseline Target: ${config.baselineBaseUrl}`);
  console.log(`   Current Target:  ${config.currentBaseUrl}`);
  console.log(`   Total Routes:    ${config.routes.length}`);
  console.log(`   Viewports:       ${config.viewports.map((v) => `${v.name} (${v.width}x${v.height})`).join(", ")}\n`);

  const results = [];

  try {
    for (const route of config.routes) {
      for (const viewport of config.viewports) {
        const routeSlug = (route.name || "route").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const testId = `${routeSlug}-${viewport.name}`;
        const baselineUrl = `${config.baselineBaseUrl}${route.baselinePath || route.path}`;
        const currentUrl = `${config.currentBaseUrl}${route.path}`;

        console.log(`🔎 Scanning [${route.name}] at ${viewport.name} (${viewport.width}x${viewport.height})...`);

        // Capture Baseline (Live site)
        const baseline = await capturePage(browser, baselineUrl, viewport, config);
        // Capture Current (SPA)
        const current = await capturePage(browser, currentUrl, viewport, config);

        if (baseline.error || current.error) {
          console.error(`   ❌ Capture Error: ${baseline.error || current.error}`);
          results.push({
            route,
            viewport,
            passed: false,
            error: baseline.error || current.error,
            visual: null,
            seo: null,
            cssDeltas: []
          });
          continue;
        }

        // Compare visual screenshots
        const visual = await compareImages(baseline.screenshot, current.screenshot, config);

        // Compare SEO metadata
        const seo = compareSeoMetadata(baseline.seo, current.seo);

        // Compare computed CSS rules
        const cssDeltas = compareComputedStyles(baseline.styles, current.styles);

        // Save image artifacts
        const baselineFilename = `${testId}-baseline.png`;
        const currentFilename = `${testId}-current.png`;
        const diffFilename = `${testId}-diff.png`;

        fs.writeFileSync(path.join(outputDir, baselineFilename), baseline.screenshot);
        fs.writeFileSync(path.join(outputDir, currentFilename), current.screenshot);
        fs.writeFileSync(path.join(outputDir, diffFilename), visual.diffBuffer);

        const passed = visual.diffPercentage <= config.failOnDiffThreshold;

        console.log(
          `   ${passed ? "✅" : "⚠️"} Diff: ${visual.diffPercentage}% (${visual.diffPixels.toLocaleString()} px) | CSS deltas: ${cssDeltas.length} | SEO: ${seo.match ? "Match" : "Variations"}`
        );

        results.push({
          route,
          viewport,
          passed,
          visual,
          seo,
          cssDeltas,
          animations: current.animations,
          interactiveStates: current.interactiveStates,
          consoleErrors: current.consoleErrors,
          networkErrors: current.networkErrors,
          perf: current.perf,
          paths: {
            baselineRelative: baselineFilename,
            currentRelative: currentFilename,
            diffRelative: diffFilename
          }
        });
      }
    }
  } finally {
    await browser.close();
  }

  // Generate interactive report
  generateHtmlReport(results, config, outputDir);

  const cleanResults = results.map((r) => ({
    ...r,
    visual: r.visual
      ? {
          width: r.visual.width,
          height: r.visual.height,
          totalPixels: r.visual.totalPixels,
          diffPixels: r.visual.diffPixels,
          diffPercentage: r.visual.diffPercentage
        }
      : null
  }));

  fs.writeFileSync(
    path.join(outputDir, "summary.json"),
    JSON.stringify({ config, timestamp: new Date().toISOString(), results: cleanResults }, null, 2),
    "utf-8"
  );

  // Generate Markdown summary if requested
  if (config.outputMd) {
    const mdSummary = generateMarkdownSummary(results, config);
    fs.writeFileSync(path.resolve(process.cwd(), config.outputMd), mdSummary, "utf-8");
  }

  console.log(`\n✨ Parity Audit Complete!`);
  console.log(`   📊 Interactive HTML Report: file:///${path.join(outputDir, "index.html").replace(/\\/g, "/")}\n`);

  return results;
}

/**
 * Generate Markdown summary suitable for GitHub / Azure DevOps PR comments
 */
function generateMarkdownSummary(results, config) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  return `# 🔍 Web Parity Kit — Audit Summary

**Baseline**: ${config.baselineBaseUrl}  
**Current**: ${config.currentBaseUrl}  
**Status**: ${failed === 0 ? "✅ All Tests Passed" : `⚠️ ${failed} Discrepancies Detected`}

| Route | Viewport | Diff % | Mismatched Pixels | CSS Deltas | SEO Match |
| :--- | :--- | :--- | :--- | :--- | :--- |
${results
  .map(
    (r) =>
      `| \`${r.route.path}\` | ${r.viewport.name} | **${r.visual?.diffPercentage || 0}%** | ${r.visual?.diffPixels?.toLocaleString() || 0} | ${r.cssDeltas?.length || 0} | ${r.seo?.match ? "✅" : "⚠️"} |`
  )
  .join("\n")}
`;
}
