import test from "node:test";
import assert from "node:assert/strict";
import { compareSeoMetadata } from "../src/dom-seo-scanner.js";

test("matches identical metadata", () => {
  const res = compareSeoMetadata({ title: "A", description: "D" }, { title: "A", description: "D" });
  assert.equal(res.match, true);
  assert.deepEqual(res.issues, []);
});

test("flags a title mismatch", () => {
  const res = compareSeoMetadata({ title: "A" }, { title: "B" });
  assert.equal(res.match, false);
  assert.ok(res.issues.some((i) => i.field === "Title" && i.status === "mismatch"));
});

test("flags a JSON-LD count difference as info", () => {
  const res = compareSeoMetadata({ jsonLdCount: 1 }, { jsonLdCount: 2 });
  assert.ok(res.issues.some((i) => i.field === "JSON-LD Count" && i.status === "info"));
});

test("is whitespace tolerant when comparing text fields", () => {
  const res = compareSeoMetadata(
    { title: "  Hello  " },
    { title: "Hello" }
  );
  assert.equal(res.match, true);
});
