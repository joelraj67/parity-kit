import { chromium } from "playwright";
import {
  triggerScrollAndLazyLoad,
  waitForFontsLoaded,
  waitForImagesLoaded,
  stabilizeUiStyles,
  applySmartMasks
} from "./preprocessors.js";
import { extractSeoMetadata } from "./dom-seo-scanner.js";
import { extractComputedStyles } from "./css-inspector.js";
import { extractPerformanceMetrics } from "./perf-scanner.js";
import { extractAnimationProperties, captureInteractiveState } from "./animation-scanner.js";

/**
 * Capture a deterministic screenshot, SEO metadata, and network health for a target URL
 */
export async function capturePage(browser, url, viewport, options = {}) {
  const consoleErrors = [];
  const networkErrors = [];

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: options.colorScheme || "light",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 WebParityKit/1.0"
  });

  const page = await context.newPage();

  // Listen for console errors & warnings
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for failed network responses (404/500)
  page.on("response", (res) => {
    if (res.status() >= 400) {
      networkErrors.push({ url: res.url(), status: res.status() });
    }
  });

  try {
    // Navigate with network idle strategy
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: options.timeout || 30000
    });

    // 1. Wait for web fonts
    if (options.waitForFonts !== false) {
      await waitForFontsLoaded(page);
    }

    // 2. Trigger scroll animations & lazy loading
    if (options.triggerScrollAnimations !== false) {
      await triggerScrollAndLazyLoad(page);
    }

    // 3. Wait for all images to decode
    await waitForImagesLoaded(page);

    // 4. Stabilize UI: hide carets, hide scrollbars, pause animations
    if (options.freezeAnimations !== false) {
      await stabilizeUiStyles(page);
    }

    // 5. Apply smart masks for 3rd-party embeds and dynamic widgets
    await applySmartMasks(page, options.maskSelectors);

    // Small stabilization pause
    await page.waitForTimeout(250);

    // Extract all telemetry
    const seo = await extractSeoMetadata(page);
    const styles = await extractComputedStyles(page);
    const perf = await extractPerformanceMetrics(page);
    const animations = await extractAnimationProperties(page);

    // Run interactive scenarios if defined
    const interactiveStates = [];
    if (options.scenarios && options.scenarios.length > 0) {
      for (const sc of options.scenarios) {
        const stateRes = await captureInteractiveState(page, sc);
        interactiveStates.push(stateRes);
      }
    }

    // Capture full-page screenshot
    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png"
    });

    return {
      url,
      viewport,
      screenshot,
      seo,
      styles,
      perf,
      animations,
      interactiveStates,
      consoleErrors,
      networkErrors,
      error: null
    };
  } catch (error) {
    return {
      url,
      viewport,
      screenshot: null,
      seo: null,
      styles: null,
      perf: null,
      animations: null,
      interactiveStates: [],
      consoleErrors,
      networkErrors,
      error: error.message
    };
  } finally {
    await context.close();
  }
}
