import test from "node:test";
import assert from "node:assert/strict";
import { compareComputedStyles } from "../src/css-inspector.js";

test("returns [] when styles match", () => {
  const base = { "Heading 1 (H1)": { fontSize: "24px", fontWeight: "700" } };
  const curr = { "Heading 1 (H1)": { fontSize: "24px", fontWeight: "700" } };
  assert.deepEqual(compareComputedStyles(base, curr), []);
});

test("detects a differing font size", () => {
  const deltas = compareComputedStyles(
    { "Heading 1 (H1)": { fontSize: "24px" } },
    { "Heading 1 (H1)": { fontSize: "20px" } }
  );
  assert.equal(deltas.length, 1);
  assert.equal(deltas[0].property, "Font Size");
  assert.equal(deltas[0].baseline, "24px");
  assert.equal(deltas[0].current, "20px");
});

test("skips elements absent in the current snapshot", () => {
  assert.deepEqual(compareComputedStyles({ "Heading 1 (H1)": { fontSize: "24px" } }, {}), []);
});

test("ignores fully transparent rgba(0, 0, 0, 0)", () => {
  const base = { "Heading 1 (H1)": { color: "rgba(0, 0, 0, 0)" } };
  const curr = { "Heading 1 (H1)": { color: "rgba(0, 0, 0, 0)" } };
  assert.deepEqual(compareComputedStyles(base, curr), []);
});
