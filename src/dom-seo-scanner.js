/**
 * SEO & DOM Structured Data Extractor and Comparator
 */
export async function extractSeoMetadata(page) {
  return await page.evaluate(() => {
    const getMeta = (query) => {
      const el = document.querySelector(query);
      return el ? (el.getAttribute("content") || el.getAttribute("href") || "") : null;
    };

    const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const jsonLdSchemas = jsonLdScripts.map((s) => {
      try {
        return JSON.parse(s.textContent || "{}");
      } catch (e) {
        return { error: "Invalid JSON-LD", raw: s.textContent };
      }
    });

    return {
      title: document.title || "",
      description: getMeta('meta[name="description"]'),
      keywords: getMeta('meta[name="keywords"]'),
      canonical: getMeta('link[rel="canonical"]'),
      openGraph: {
        title: getMeta('meta[property="og:title"]'),
        description: getMeta('meta[property="og:description"]'),
        image: getMeta('meta[property="og:image"]'),
        url: getMeta('meta[property="og:url"]')
      },
      twitter: {
        card: getMeta('meta[name="twitter:card"]'),
        title: getMeta('meta[name="twitter:title"]'),
        description: getMeta('meta[name="twitter:description"]'),
        image: getMeta('meta[name="twitter:image"]')
      },
      jsonLdCount: jsonLdSchemas.length,
      jsonLdSchemas
    };
  });
}

/**
 * Compare SEO metadata between baseline and current pages
 */
export function compareSeoMetadata(baseline, current) {
  const issues = [];

  if (baseline.title && current.title) {
    if (baseline.title.trim() !== current.title.trim()) {
      issues.push({
        field: "Title",
        baseline: baseline.title,
        current: current.title,
        status: "mismatch"
      });
    }
  }

  if (baseline.description && current.description) {
    if (baseline.description.trim() !== current.description.trim()) {
      issues.push({
        field: "Description",
        baseline: baseline.description,
        current: current.description,
        status: "mismatch"
      });
    }
  }

  if (baseline.jsonLdCount !== current.jsonLdCount) {
    issues.push({
      field: "JSON-LD Count",
      baseline: `${baseline.jsonLdCount} schemas`,
      current: `${current.jsonLdCount} schemas`,
      status: "info"
    });
  }

  return {
    baseline,
    current,
    match: issues.length === 0,
    issues
  };
}
