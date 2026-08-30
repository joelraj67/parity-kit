/**
 * Deep Computed CSS and DOM Geometry Inspector
 */

/**
 * Extract computed layout and typography rules from page
 */
export async function extractComputedStyles(page) {
  return await page.evaluate(() => {
    const targets = [
      { selector: "h1", label: "Heading 1 (H1)" },
      { selector: "h2", label: "Heading 2 (H2)" },
      { selector: "h3", label: "Heading 3 (H3)" },
      { selector: "p", label: "Body Paragraph (P)" },
      { selector: "header", label: "Header Container" },
      { selector: "nav", label: "Navigation Bar" },
      { selector: "button, .btn, .thm-btn", label: "Primary Button" },
      { selector: "footer", label: "Footer Container" },
      { selector: ".container, main", label: "Main Container" },
    ];

    const results = {};

    for (const t of targets) {
      const el = document.querySelector(t.selector);
      if (el) {
        const style = window.getComputedStyle(el);
        results[t.label] = {
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          fontFamily: style.fontFamily?.split(",")[0]?.replace(/["']/g, "") || "",
          lineHeight: style.lineHeight,
          color: style.color,
          backgroundColor: style.backgroundColor,
          padding: style.padding,
          marginBottom: style.marginBottom,
          display: style.display,
          width: style.width,
          maxWidth: style.maxWidth,
        };
      }
    }

    return results;
  });
}

/**
 * Compare computed CSS rules between baseline and modern SPA
 */
export function compareComputedStyles(baselineStyles = {}, currentStyles = {}) {
  const deltas = [];

  for (const [elementLabel, baseStyle] of Object.entries(baselineStyles)) {
    const currStyle = currentStyles[elementLabel];
    if (!currStyle) continue;

    const propertiesToCompare = [
      { key: "fontSize", name: "Font Size" },
      { key: "fontWeight", name: "Font Weight" },
      { key: "lineHeight", name: "Line Height" },
      { key: "marginBottom", name: "Margin Bottom" },
      { key: "padding", name: "Padding" },
      { key: "color", name: "Text Color" },
      { key: "backgroundColor", name: "Background Color" },
    ];

    for (const prop of propertiesToCompare) {
      const bVal = baseStyle[prop.key];
      const cVal = currStyle[prop.key];

      if (
        bVal &&
        cVal &&
        bVal !== cVal &&
        bVal !== "rgba(0, 0, 0, 0)" &&
        cVal !== "rgba(0, 0, 0, 0)"
      ) {
        deltas.push({
          element: elementLabel,
          property: prop.name,
          baseline: bVal,
          current: cVal,
        });
      }
    }
  }

  return deltas;
}
