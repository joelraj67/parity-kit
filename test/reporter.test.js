import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateHtmlReport } from "../src/reporter.js";

test("writes a standalone, self-contained index.html with route data", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-report-"));
  const results = [
    {
      route: { name: "Homepage", path: "/" },
      viewport: { name: "desktop", width: 1280, height: 800 },
      passed: true,
      visual: { diffPercentage: 0, diffPixels: 0, width: 10, height: 10 },
      seo: { match: true, issues: [] },
      cssDeltas: [],
      paths: { baselineRelative: "a.png", currentRelative: "b.png", diffRelative: "c.png" }
    }
  ];
  const config = { baselineBaseUrl: "https://a.com", currentBaseUrl: "https://b.com" };
  generateHtmlReport(results, config, dir);
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.match(html, /Web Parity Kit/);
  assert.match(html, /Homepage/);
});
