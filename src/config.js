import fs from "node:fs";
import path from "node:path";

/**
 * Default Parity Scanner Configuration
 */
export const DEFAULT_CONFIG = {
  baselineBaseUrl: "https://hansaitechnosoft.com",
  currentBaseUrl: "http://localhost:3000",
  outputDir: "./parity-report",
  threshold: 0.1, // Pixelmatch threshold (0.0 strictly identical, 0.1 filters subpixel anti-aliasing)
  failOnDiffThreshold: 1.0, // Fail CI if mismatch exceeds 1.0%
  viewports: [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 375, height: 812 }
  ],
  maskSelectors: [
    ".live-clock",
    ".date-badge-dynamic"
  ],
  routes: [
    { name: "Homepage", path: "/" }
  ],
  concurrency: 2,
  freezeAnimations: true,
  waitForFonts: true,
  triggerScrollAnimations: true,
  timeout: 30000
};

/**
 * Load and merge user configuration file
 */
export function loadConfig(configPath) {
  if (!configPath) {
    return DEFAULT_CONFIG;
  }
  const resolvedPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found at: ${resolvedPath}`);
  }
  const raw = fs.readFileSync(resolvedPath, "utf-8");
  const cleanRaw = raw.replace(/^\uFEFF/, "");
  const userConfig = JSON.parse(cleanRaw);
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    viewports: userConfig.viewports || DEFAULT_CONFIG.viewports,
    routes: userConfig.routes || DEFAULT_CONFIG.routes
  };
}
