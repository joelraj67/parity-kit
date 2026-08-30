/**
 * Automated Sitemap XML Parser and Internal Link Crawler
 */

/**
 * Fetch and extract URLs from a sitemap.xml (supports sitemap index and URL sets)
 */
export async function fetchSitemapUrls(sitemapUrl, maxPages = 100) {
  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": "WebParityKit/1.0 Crawler" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`);
    }
    const xml = await res.text();
    const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
    const urls = locMatches.map((m) => m[1].trim());

    // Filter out image/media sitemaps and deduplicate
    const pageUrls = [...new Set(urls.filter((u) => !u.endsWith(".xml")))];
    return pageUrls.slice(0, maxPages);
  } catch (error) {
    console.warn(`⚠️ Warning: Could not parse sitemap at ${sitemapUrl}:`, error.message);
    return [];
  }
}

/**
 * Crawl internal links on a website starting from base URL
 */
export async function crawlSiteRoutes(browser, baseUrl, maxPages = 30) {
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebParityKit/1.0",
  });
  const page = await context.newPage();
  const visited = new Set();
  const queue = ["/"];
  const baseOrigin = new URL(baseUrl).origin;

  try {
    while (queue.length > 0 && visited.size < maxPages) {
      const currentPath = queue.shift();
      if (!currentPath || visited.has(currentPath)) continue;
      visited.add(currentPath);

      const targetUrl = new URL(currentPath, baseUrl).toString();
      try {
        await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a[href]"))
            .map((a) => a.getAttribute("href"))
            .filter(Boolean);
        });

        for (const link of links) {
          try {
            const resolved = new URL(link, targetUrl);
            if (
              resolved.origin === baseOrigin &&
              !resolved.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|css|js|zip|webp)$/i) &&
              !resolved.pathname.startsWith("/api/")
            ) {
              const pathOnly = resolved.pathname + (resolved.search || "");
              if (!visited.has(pathOnly) && !queue.includes(pathOnly)) {
                queue.push(pathOnly);
              }
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      } catch (err) {
        console.warn(`   ⚠️ Could not crawl ${targetUrl}:`, err.message);
      }
    }
  } finally {
    await context.close();
  }

  return Array.from(visited).map((p) => ({
    name:
      p === "/"
        ? "Homepage"
        : p
            .replace(/^\//, "")
            .replace(/\/$/, "")
            .replace(/[^a-zA-Z0-9]/g, " "),
    path: p,
  }));
}
