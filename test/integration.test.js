import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const PAGE = `<!doctype html><html><head><title>Parity Test</title>
<meta name="description" content="integration fixture">
<link rel="canonical" href="http://localhost/">
<style>h1{font-size:24px;font-weight:700}p{font-size:16px}</style>
</head><body><h1>Hello</h1><p>World</p></body></html>`;

function startServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(PAGE);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

test("runParityScan against identical local pages passes with zero diff", async (t) => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    t.skip(`Playwright Chromium not installed: ${err.message}`);
    return;
  }

  const server = await startServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://localhost:${port}`;
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-int-"));

  try {
    const { runParityScan } = await import("../src/index.js");
    const results = await runParityScan({
      baselineBaseUrl: base,
      currentBaseUrl: base,
      outputDir,
      routes: [{ name: "Home", path: "/" }],
      viewports: [{ name: "desktop", width: 800, height: 600 }]
    });

    assert.ok(Array.isArray(results) && results.length >= 1);
    const first = /** @type {any} */ (results[0]);
    assert.equal(first.passed, true);
    assert.ok(first.visual.diffPercentage <= 0.0001);
    assert.ok(fs.existsSync(path.join(outputDir, "index.html")));
  } finally {
    await browser.close();
    server.close();
  }
});

const PAGE_A = `<!doctype html><html><head><title>A</title><style>body{background:#ffffff;margin:0}h1{font-size:24px}</style></head><body><h1>Hello</h1></body></html>`;
const PAGE_B = `<!doctype html><html><head><title>B</title><style>body{background:#e0e0e0;margin:0}h1{font-size:24px}</style></head><body><h1>Hello</h1></body></html>`;

test("suppresses perceptually-identical (cosmetic) regressions via the SSIM gate", async (t) => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    t.skip(`Playwright Chromium not installed: ${err.message}`);
    return;
  }

  const serverA = http.createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(PAGE_A);
  });
  const serverB = http.createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(PAGE_B);
  });
  await new Promise((resolve) => serverA.listen(0, () => resolve(serverA)));
  await new Promise((resolve) => serverB.listen(0, () => resolve(serverB)));
  const addrA = serverA.address();
  const addrB = serverB.address();
  const portA = typeof addrA === "object" && addrA ? addrA.port : 0;
  const portB = typeof addrB === "object" && addrB ? addrB.port : 0;
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-ssim-"));

  try {
    const { runParityScan } = await import("../src/index.js");

    const withGate = await runParityScan({
      baselineBaseUrl: `http://localhost:${portA}`,
      currentBaseUrl: `http://localhost:${portB}`,
      outputDir: outDir,
      routes: [{ name: "Home", path: "/" }],
      viewports: [{ name: "desktop", width: 800, height: 600 }]
    });
    const gated = /** @type {any} */ (withGate[0]);
    // A localized cosmetic change is a high pixel-diff but SSIM ~0.98+ => perceived as identical.
    assert.equal(gated.passed, true);
    assert.ok(gated.visual.ssim > 0.98);

    const noGate = await runParityScan({
      baselineBaseUrl: `http://localhost:${portA}`,
      currentBaseUrl: `http://localhost:${portB}`,
      outputDir: outDir,
      ssimThreshold: undefined,
      routes: [{ name: "Home", path: "/" }],
      viewports: [{ name: "desktop", width: 800, height: 600 }]
    });
    const ungated = /** @type {any} */ (noGate[0]);
    // Without the perceptual gate the cosmetic shift fails the pixel gate.
    assert.equal(ungated.passed, false);
  } finally {
    await browser.close();
    serverA.close();
    serverB.close();
  }
});

test("scans every browser x viewport combination", async (t) => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    t.skip(`Playwright Chromium not installed: ${err.message}`);
    return;
  }
  const server = await startServer();
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const base = `http://localhost:${port}`;
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-matrix-"));

  try {
    const { runParityScan } = await import("../src/index.js");
    const results = await runParityScan({
      baselineBaseUrl: base,
      currentBaseUrl: base,
      outputDir,
      browsers: ["chromium"],
      routes: [{ name: "Home", path: "/" }],
      viewports: [
        { name: "desktop", width: 800, height: 600 },
        { name: "mobile", width: 375, height: 812 }
      ]
    });

    assert.equal(results.length, 2);
    assert.ok(results.every((r) => r.browser === "chromium"));
    const vpNames = results.map((r) => r.viewport.name).sort();
    assert.deepEqual(vpNames, ["desktop", "mobile"]);
    assert.ok(results.every((r) => r.passed));
  } finally {
    await browser.close();
    server.close();
  }
});

test("rejects an unsupported browser name", async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-bad-"));
  await assert.rejects(
    () =>
      runParityScanFromDefault({
        baselineBaseUrl: "http://localhost:1",
        currentBaseUrl: "http://localhost:1",
        outputDir,
        browsers: ["opera"],
        routes: [{ name: "Home", path: "/" }],
        viewports: [{ name: "desktop", width: 800, height: 600 }]
      }),
    /Unsupported browser/
  );
});

// Local alias so the unsupported-browser test re-imports cleanly.
async function runParityScanFromDefault(options) {
  const { runParityScan } = await import("../src/index.js");
  return runParityScan(options);
}
