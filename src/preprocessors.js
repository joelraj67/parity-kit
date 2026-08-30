/**
 * Edge-Case Preprocessors for Deterministic Visual Snapshots
 */

/**
 * Trigger all IntersectionObservers, AOS, ScrollReveal and lazy-loaded assets
 * by virtually scrolling down the document and returning to top.
 */
export async function triggerScrollAndLazyLoad(page) {
  await page.evaluate(async () => {
    // Disable smooth scrolling during programmatic scroll
    const origScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 450;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        window.dispatchEvent(new Event("scroll"));
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0); // Return to top for baseline capture
          document.documentElement.style.scrollBehavior = origScrollBehavior;
          setTimeout(resolve, 250);
        }
      }, 40);
    });
  });
}

/**
 * Await web font readiness (document.fonts.ready) to avoid FOIT/FOUT rendering artifacts.
 */
export async function waitForFontsLoaded(page) {
  try {
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });
  } catch (e) {
    // Ignore if document.fonts is not supported
  }
}

/**
 * Ensure all image elements are fully downloaded and decoded before snapshotting
 */
export async function waitForImagesLoaded(page) {
  try {
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((res) => {
            img.onload = res;
            img.onerror = res;
            setTimeout(res, 2000); // Timeout guard per image
          });
        }),
      );
    });
  } catch (e) {
    // Fallback if image decode fails
  }
}

/**
 * Stabilize UI elements: eliminate blinking carets, hide scrollbars, and freeze animations
 */
export async function stabilizeUiStyles(page) {
  try {
    await page.evaluate(() => {
    const activeElement = /** @type {HTMLElement | null} */ (document.activeElement);
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
    });
  } catch (e) {}

  await page.addStyleTag({
    content: `
      /* Freeze all CSS transitions and keyframe animations */
      *, *::before, *::after {
        -webkit-animation-play-state: paused !important;
        animation-play-state: paused !important;
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }

      /* Hide native browser scrollbars across all operating systems */
      html, body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      ::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
      }
    `,
  });
}

/**
 * Smart mask for dynamic 3rd party widgets, embeds, maps, and cookies
 */
export async function applySmartMasks(page, customMasks = []) {
  const defaultSmartSelectors = [
    'iframe[src*="google.com/maps"]',
    'iframe[src*="youtube"]',
    'iframe[src*="vimeo"]',
    "#hubspot-messages-iframe-container",
    "#intercom-container",
    '[class*="crisp-client"]',
    "#drift-widget",
    "#launcher",
    '[id*="cookie-banner"]',
    '[id*="cookie-law"]',
    '[class*="cookie-consent"]',
    "#onetrust-consent-sdk",
  ];

  const allSelectors = [...new Set([...defaultSmartSelectors, ...(customMasks || [])])];
  const combinedQuery = allSelectors.join(", ");

  await page.addStyleTag({
    content: `
      ${combinedQuery} {
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `,
  });
}
