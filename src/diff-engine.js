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
      aaColor: [255, 200, 0] // Yellow for anti-aliasing variations
    }
  );

  const totalPixels = maxWidth * maxHeight;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  const diffBuffer = PNG.sync.write(diff);

  return {
    width: maxWidth,
    height: maxHeight,
    totalPixels,
    diffPixels,
    diffPercentage: Number(diffPercentage.toFixed(4)),
    diffBuffer
  };
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
