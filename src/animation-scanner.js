/**
 * Animation & Interactive State Scanner
 */

/**
 * Extract CSS transition and keyframe animation properties from interactive elements
 */
export async function extractAnimationProperties(page) {
  return await page.evaluate(() => {
    const targets = [
      { selector: "button, .btn, .thm-btn", label: "Button Transitions" },
      { selector: ".dropdown-menu, .nav-item", label: "Dropdown Transitions" },
      { selector: ".card, .service-card, .vcto-card", label: "Card Hover Elevations" },
      { selector: ".accordion-collapse, .collapse", label: "Accordion Collapse Animation" },
      { selector: "[data-aos], .animate__animated", label: "Scroll-Triggered Keyframes" },
    ];

    const results = {};

    for (const t of targets) {
      const el = document.querySelector(t.selector);
      if (el) {
        const style = window.getComputedStyle(el);
        results[t.label] = {
          transitionProperty: style.transitionProperty,
          transitionDuration: style.transitionDuration,
          transitionTimingFunction: style.transitionTimingFunction,
          transitionDelay: style.transitionDelay,
          animationName: style.animationName,
          animationDuration: style.animationDuration,
          animationTimingFunction: style.animationTimingFunction,
        };
      }
    }

    return results;
  });
}

/**
 * Execute an interaction scenario (hover, click, scroll) and capture the resulting animated state
 */
export async function captureInteractiveState(page, scenario) {
  try {
    if (scenario.action === "hover" && scenario.selector) {
      const el = await page.$(scenario.selector);
      if (el) {
        await el.hover();
        if (scenario.waitFor) {
          await page.waitForSelector(scenario.waitFor, { timeout: 3000 }).catch(() => {});
        }
        await page.waitForTimeout(scenario.delay || 400); // Allow transition to complete
      }
    } else if (scenario.action === "click" && scenario.selector) {
      const el = await page.$(scenario.selector);
      if (el) {
        await el.click();
        if (scenario.waitFor) {
          await page.waitForSelector(scenario.waitFor, { timeout: 3000 }).catch(() => {});
        }
        await page.waitForTimeout(scenario.delay || 400); // Allow opening animation
      }
    } else if (scenario.action === "scroll" && scenario.distance) {
      await page.evaluate((d) => window.scrollBy(0, d), scenario.distance);
      await page.waitForTimeout(scenario.delay || 400);
    }

    const screenshot = await page.screenshot({ fullPage: false, type: "png" });
    return {
      scenarioName: scenario.name,
      screenshot,
      error: null,
    };
  } catch (err) {
    return {
      scenarioName: scenario.name,
      screenshot: null,
      error: err.message,
    };
  }
}
