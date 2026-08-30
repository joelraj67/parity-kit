import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
test("cli --help exits 0", () => {
  const out = execSync("node bin/cli.js --help", { encoding: "utf8" });
  assert.match(out, /parity-kit/);
});
test("config defaults", async () => {
  const { DEFAULT_CONFIG } = await import("../src/config.js");
  assert.equal(typeof DEFAULT_CONFIG.threshold, "number");
  assert.ok(Array.isArray(DEFAULT_CONFIG.viewports));
});
test("cli init writes a parity.config.json", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pk-init-"));
  const cliPath = path.resolve("bin/cli.js");
  execSync(`node "${cliPath}" init --baseline https://a.com --current http://localhost:3000`, {
    cwd: dir,
    encoding: "utf8"
  });
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, "parity.config.json"), "utf8"));
  assert.equal(cfg.baselineBaseUrl, "https://a.com");
  assert.equal(cfg.currentBaseUrl, "http://localhost:3000");
  assert.ok(Array.isArray(cfg.routes));
});
