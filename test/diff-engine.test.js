import test from "node:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";
import { compareImages } from "../src/diff-engine.js";

function makePng(width, height, fill) {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = fill[0];
    png.data[i + 1] = fill[1];
    png.data[i + 2] = fill[2];
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}

const WHITE = makePng(10, 10, [255, 255, 255]);
const BLACK = makePng(10, 10, [0, 0, 0]);
const SMALL_WHITE = makePng(4, 4, [255, 255, 255]);
const LARGE_WHITE = makePng(16, 16, [255, 255, 255]);

test("identical images produce zero diff", async () => {
  const res = await compareImages(WHITE, WHITE, {});
  assert.equal(res.diffPixels, 0);
  assert.equal(res.diffPercentage, 0);
  assert.equal(res.width, 10);
  assert.equal(res.height, 10);
});

test("different images produce a non-zero diff", async () => {
  const res = await compareImages(WHITE, BLACK, {});
  assert.ok(res.diffPixels > 0);
  assert.ok(res.diffPercentage > 0);
  assert.ok(Buffer.isBuffer(res.diffBuffer));
});

test("threshold option is honored", async () => {
  const res = await compareImages(WHITE, BLACK, { threshold: 1 });
  assert.equal(res.diffPixels, 0);
  assert.equal(res.diffPercentage, 0);
});

test("mismatched image sizes are normalized before diffing", async () => {
  const res = await compareImages(SMALL_WHITE, LARGE_WHITE, {});
  assert.equal(res.diffPixels, 0);
  assert.equal(res.width, 16);
  assert.equal(res.height, 16);
});

test("identical images have SSIM ~= 1", async () => {
  const res = await compareImages(WHITE, WHITE, {});
  assert.ok(res.ssim !== undefined);
  assert.ok(res.ssim >= 0.999);
});

test("visually different images have a low SSIM", async () => {
  const res = await compareImages(WHITE, BLACK, {});
  assert.ok(res.ssim < 0.5);
});

test("SSIM is near 1 for a single-pixel color shift (cosmetic noise)", async () => {
  // A tiny black speck on an otherwise white image is a high-SSIM (perceptually
  // identical) change — exactly the noise raw pixel diffing would over-flag.
  const base = makePng(20, 20, [255, 255, 255]);
  const speck = makePng(20, 20, [255, 255, 255]);
  const bp = PNG.sync.read(speck);
  bp.data[0] = 0;
  bp.data[1] = 0;
  bp.data[2] = 0;
  const speckBuf = PNG.sync.write(bp);
  const res = await compareImages(base, speckBuf, {});
  assert.ok(res.ssim >= 0.99);
});
