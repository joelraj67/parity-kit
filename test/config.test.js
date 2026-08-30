import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_CONFIG, loadConfig } from "../src/config.js";

test("DEFAULT_CONFIG has the expected shape", () => {
  assert.equal(typeof DEFAULT_CONFIG.threshold, "number");
  assert.ok(Array.isArray(DEFAULT_CONFIG.viewports));
  assert.equal(DEFAULT_CONFIG.failOnDiffThreshold, 1.0);
  assert.ok(Array.isArray(DEFAULT_CONFIG.routes));
});

test("loadConfig(null) returns the defaults", () => {
  const cfg = loadConfig(null);
  assert.equal(cfg.baselineBaseUrl, DEFAULT_CONFIG.baselineBaseUrl);
  assert.ok(Array.isArray(cfg.routes));
});

test("loadConfig merges a user file over the defaults", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-cfg-"));
  const file = path.join(dir, "cfg.json");
  fs.writeFileSync(file, JSON.stringify({ threshold: 0.5, failOnDiffThreshold: 3 }));
  const cfg = loadConfig(file);
  assert.equal(cfg.threshold, 0.5);
  assert.equal(cfg.failOnDiffThreshold, 3);
  assert.ok(Array.isArray(cfg.viewports));
});

test("loadConfig preserves default viewports/routes when omitted", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-cfg2-"));
  const file = path.join(dir, "cfg.json");
  fs.writeFileSync(file, JSON.stringify({ threshold: 0.2 }));
  const cfg = loadConfig(file);
  assert.equal(cfg.viewports.length, DEFAULT_CONFIG.viewports.length);
  assert.equal(cfg.routes.length, DEFAULT_CONFIG.routes.length);
});

test("loadConfig throws on a missing file", () => {
  assert.throws(() => loadConfig("/nonexistent/path/cfg.json"));
});

test("loadConfig defaults to a single chromium browser", () => {
  const cfg = loadConfig(null);
  assert.deepEqual(cfg.browsers, ["chromium"]);
});

test("loadConfig overrides the browsers list", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-cfg3-"));
  const file = path.join(dir, "cfg.json");
  fs.writeFileSync(file, JSON.stringify({ browsers: ["chromium", "firefox"] }));
  const cfg = loadConfig(file);
  assert.deepEqual(cfg.browsers, ["chromium", "firefox"]);
});
