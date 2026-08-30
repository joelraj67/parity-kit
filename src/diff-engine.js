import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

/**
 * Compare two PNG buffers using Pixelmatch and return detailed difference metrics
 */
export async function compareImages(baselineBuffer, currentBuffer, options = {}) {
  const threshold = options.threshold !== undefined ? options.threshold : 0.1;

  const img1 = PNG.sync.read(baselineBuffer);
  const img2 = PNG.sync.read(currentBuffer);

  const maxWidth = Math.max(img1.width, img2.width);
  const maxHeight = Math.max(img1.height, img2.height);

  // Normalize image dimensions to prevent bounds mismatch errors
  const normalized1 = normalizeImageSize(img1, maxWidth, maxHeight);
  const normalized2 = normalizeImageSize(img2, maxWidth, maxHeight);

  const diff = new PNG({ width: maxWidth, height: maxHeight });

  const diffPixels = pixelmatch(
    normalized1.data,
    normalized2.data,
    diff.data,
    maxWidth,
    maxHeight,
    {
      threshold,
      includeAA: false, // Filter subpixel anti-aliasing variations
      diffColor: [255, 0, 80], // High-contrast magenta/red for mismatched pixels
      aaColor: [255, 200, 0], // Yellow for anti-aliasing variations
    },
  );

  const totalPixels = maxWidth * maxHeight;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  const diffBuffer = PNG.sync.write(diff);

  // Perceptual similarity (SSIM) on a downscaled luminance field.
  // Pixelmatch catches localized change but is noisy on anti-aliasing / font
  // rendering differences; SSIM gives a global perceptual score (0..1) that
  // tolerates cosmetic noise, dramatically cutting false-positive deviation.
  const TARGET = 256;
  const g1 = luminanceDownscale(normalized1.data, maxWidth, maxHeight, TARGET);
  const g2 = luminanceDownscale(normalized2.data, maxWidth, maxHeight, TARGET);
  const ssim = computeSSIM(g1, g2, TARGET);

  return {
    width: maxWidth,
    height: maxHeight,
    totalPixels,
    diffPixels,
    diffPercentage: Number(diffPercentage.toFixed(4)),
    ssim: Number(ssim.toFixed(6)),
    diffBuffer
  };
}

/**
 * Sample the RGBA buffer into a `target x target` luminance (Y) field using
 * nearest-neighbour sampling, so every target pixel is filled regardless of
 * whether the source is larger or smaller than the target (no zero padding).
 */
function luminanceDownscale(data, width, height, target) {
  const out = new Float64Array(target * target);
  const sx = width / target;
  const sy = height / target;

  for (let ty = 0; ty < target; ty++) {
    const syIdx = Math.min(height - 1, Math.floor((ty + 0.5) * sy));
    for (let tx = 0; tx < target; tx++) {
      const sxIdx = Math.min(width - 1, Math.floor((tx + 0.5) * sx));
      const i = (syIdx * width + sxIdx) * 4;
      out[ty * target + tx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
  }
  return out;
}

/**
 * Mean Structural Similarity Index (Wang et al., 2004) computed over an
 * 8x8 sliding window and averaged. Windowing avoids the single-window
 * degeneracy that occurs when a reference region is a constant field, and
 * matches how perceptual similarity is normally measured (local structure).
 * Returns 1.0 for identical inputs, lower for dissimilar.
 */
function computeSSIM(g1, g2, size, win = 8) {
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  let sum = 0;
  let count = 0;
  const area = win * win;

  for (let y = 0; y + win <= size; y++) {
    for (let x = 0; x + win <= size; x++) {
      let mx = 0;
      let my = 0;
      for (let j = 0; j < win; j++) {
        for (let i = 0; i < win; i++) {
          const idx = (y + j) * size + (x + i);
          mx += g1[idx];
          my += g2[idx];
        }
      }
      mx /= area;
      my /= area;

      let vx = 0;
      let vy = 0;
      let vxy = 0;
      for (let j = 0; j < win; j++) {
        for (let i = 0; i < win; i++) {
          const idx = (y + j) * size + (x + i);
          const dx = g1[idx] - mx;
          const dy = g2[idx] - my;
          vx += dx * dx;
          vy += dy * dy;
          vxy += dx * dy;
        }
      }
      vx /= area;
      vy /= area;
      vxy /= area;

      const den = (mx * mx + my * my + C1) * (vx + vy + C2);
      const ssim = den === 0 ? 1 : ((2 * mx * my + C1) * (2 * vxy + C2)) / den;
      sum += ssim;
      count++;
    }
  }

  return count ? sum / count : 1;
}

/**
 * Pad an image with a white background if it is smaller than target dimensions
 */
function normalizeImageSize(img, targetWidth, targetHeight) {
  if (img.width === targetWidth && img.height === targetHeight) {
    return img;
  }

  const normalized = new PNG({ width: targetWidth, height: targetHeight, fill: true });
  // Initialize with white background
  for (let i = 0; i < normalized.data.length; i += 4) {
    normalized.data[i] = 255;
    normalized.data[i + 1] = 255;
    normalized.data[i + 2] = 255;
    normalized.data[i + 3] = 255;
  }

  PNG.bitblt(img, normalized, 0, 0, img.width, img.height, 0, 0);
  return normalized;
}
