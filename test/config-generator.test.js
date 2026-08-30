import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  detectLocalRoutes,
  detectLegacyRouteMappings,
  formatRouteName
} from "../src/config-generator.js";

test("formatRouteName", () => {
  assert.equal(formatRouteName("/"), "Homepage");
  assert.equal(formatRouteName("/about"), "About");
  assert.equal(formatRouteName("/blog/my-post"), "Blog My Post");
});

test("detectLocalRoutes finds Next.js app router routes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pk-app-"));
  fs.mkdirSync(path.join(root, "app", "about"), { recursive: true });
  fs.writeFileSync(path.join(root, "app", "page.tsx"), "");
  fs.writeFileSync(path.join(root, "app", "about", "page.tsx"), "");
  const routes = detectLocalRoutes(root);
  const names = routes.map((r) => r.name);
  assert.ok(names.includes("Homepage"));
  assert.ok(names.includes("About"));
});

test("detectLocalRoutes falls back to a Homepage route", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pk-empty-"));
  const routes = detectLocalRoutes(root);
  assert.deepEqual(routes, [{ name: "Homepage", path: "/" }]);
});

test("detectLegacyRouteMappings parses _redirects", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pk-redir-"));
  fs.writeFileSync(path.join(root, "_redirects"), "/old /new\n# comment\n/foo /bar");
  const maps = detectLegacyRouteMappings(root);
  assert.equal(maps["/new"], "/old");
  assert.equal(maps["/bar"], "/foo");
});

test("detectLegacyRouteMappings parses vercel.json redirects", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pk-vercel-"));
  fs.writeFileSync(
    path.join(root, "vercel.json"),
    JSON.stringify({ redirects: [{ source: "/a", destination: "/b" }] })
  );
  const maps = detectLegacyRouteMappings(root);
  assert.equal(maps["/b"], "/a");
});
