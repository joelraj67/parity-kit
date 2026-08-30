#!/usr/bin/env node

import { runParityScan } from "../src/index.js";
import { generateParityConfig } from "../src/config-generator.js";

const args = process.argv.slice(2);
const options = {};

// Handle "init" command
if (args[0] === "init" || args[0] === "--init") {
  let baseline = "https://hansaitechnosoft.com";
  let current = "http://localhost:3000";
  let outputConfig = "parity.config.json";

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--baseline" || args[i] === "-b") baseline = args[++i];
    else if (args[i] === "--current") current = args[++i];
    else if (args[i] === "--output" || args[i] === "-o") outputConfig = args[++i];
  }

  generateParityConfig({ baseline, current, outputConfig });
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--help" || arg === "-h") {
    console.log(`
🔍 parity-kit (v1.0.0) — Visual, CSS, Animation & SEO Parity Scanner

Usage:
  npx parity-kit init [options]
  npx parity-kit <baseline-url> <current-url> [options]
  npx parity-kit --config <path-to-config.json>

Commands:
  init                     Automatically discover routes & redirects to create parity.config.json

Options:
  -c, --config <path>      Path to JSON configuration file
  -s, --sitemap <url>      Auto-discover routes from sitemap.xml
  -B, --browsers <list>    Comma-separated browsers to scan (chromium,firefox,webkit). Default: chromium
  -V, --viewports <list>    Comma-separated WxH resolutions (e.g. 1280x800,375x812)
  --crawl                  Auto-crawl internal links starting from baseline URL
  -o, --output-dir <path>  Output directory for HTML dashboard (default: ./parity-report)
  --output-md <path>       Output Markdown summary table for PR comments
  -t, --threshold <num>    Pixelmatch threshold (default: 0.1)
  -v, --version            Display version number
  -h, --help               Display this help guide
  (legacy alias: npx web-parity-kit still works)
`);
    process.exit(0);
  } else if (arg === "--version" || arg === "-v") {
    console.log("parity-kit v1.0.0");
    process.exit(0);
  } else if (arg === "--config" || arg === "-c") {
    options.configPath = args[++i];
  } else if (arg === "--sitemap" || arg === "-s") {
    options.sitemapUrl = args[++i];
  } else if (arg === "--browsers" || arg === "-B") {
    options.browsers = args[++i].split(",").map((b) => b.trim());
  } else if (arg === "--viewports" || arg === "-V") {
    options.viewports = args[++i].split(",").map((v) => {
      const [w, h] = v.trim().split("x").map(Number);
      return { name: v.trim(), width: w, height: h };
    });
  } else if (arg === "--crawl") {
    options.crawl = true;
  } else if (arg === "--output-md") {
    options.outputMd = args[++i];
  } else if (arg === "--output-dir" || arg === "-o") {
    options.outputDir = args[++i];
  } else if (arg === "--threshold" || arg === "-t") {
    options.threshold = parseFloat(args[++i]);
  } else if (arg.startsWith("http://") || arg.startsWith("https://")) {
    if (!options.baselineBaseUrl) {
      options.baselineBaseUrl = arg;
    } else if (!options.currentBaseUrl) {
      options.currentBaseUrl = arg;
    }
  }
}

runParityScan(options)
  .then((results) => {
    const hasFailures = results.some((r) => !r.passed);
    process.exit(hasFailures ? 1 : 0);
  })
  .catch((err) => {
    console.error("\n❌ Fatal Error running parity-kit:", err);
    process.exit(1);
  });
