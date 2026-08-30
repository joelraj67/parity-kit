import test from "node:test";
import assert from "node:assert/strict";
import { fetchSitemapUrls } from "../src/sitemap-crawler.js";

const SAMPLE_XML = `<?xml version="1.0"?>
  <urlset>
    <url><loc>https://example.com/</loc></url>
    <url><loc>https://example.com/about</loc></url>
    <url><loc>https://example.com/about</loc></url>
    <url><loc>https://example.com/images.xml</loc></url>
  </urlset>`;

test("parses loc entries, dedupes, and ignores xml sitemaps", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = /** @type {any} */ (async () => ({ ok: true, text: async () => SAMPLE_XML }));
  try {
    const urls = await fetchSitemapUrls("https://example.com/sitemap.xml", 100);
    assert.equal(urls.length, 2);
    const exampleHost = new URL("https://example.com/").host;
    assert.ok(urls.some((u) => new URL(u).host === exampleHost));
    const aboutHost = new URL("https://example.com/about").host;
    assert.ok(urls.some((u) => new URL(u).host === aboutHost));
    assert.ok(!urls.some((u) => u.endsWith(".xml")));
  } finally {
    globalThis.fetch = original;
  }
});

test("respects the maxPages limit", async () => {
  const xml = Array.from({ length: 5 }, (_, i) => `<url><loc>https://e.com/p${i}</loc></url>`).join("");
  const original = globalThis.fetch;
  globalThis.fetch = /** @type {any} */ (async () => ({
    ok: true,
    text: async () => `<urlset>${xml}</urlset>`
  }));
  try {
    const urls = await fetchSitemapUrls("https://e.com/sitemap.xml", 3);
    assert.equal(urls.length, 3);
  } finally {
    globalThis.fetch = original;
  }
});

test("returns [] when fetch fails", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = /** @type {any} */ (async () => {
    throw new Error("boom");
  });
  try {
    const urls = await fetchSitemapUrls("https://example.com/sitemap.xml");
    assert.deepEqual(urls, []);
  } finally {
    globalThis.fetch = original;
  }
});
