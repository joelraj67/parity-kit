/**
 * Navigation Timing & Web Performance Metrics Collector
 */
export async function extractPerformanceMetrics(page) {
  return await page.evaluate(() => {
    const timing = /** @type {PerformanceNavigationTiming} */ (
      performance.getEntriesByType("navigation")[0]
    );
    const resources = /** @type {PerformanceResourceTiming[]} */ (
      performance.getEntriesByType("resource")
    );

    return {
      domContentLoaded: timing ? Math.round(timing.domContentLoadedEventEnd - timing.startTime) : 0,
      loadTime: timing ? Math.round(timing.loadEventEnd - timing.startTime) : 0,
      ttfb: timing ? Math.round(timing.responseStart - timing.requestStart) : 0,
      totalDomElements: document.getElementsByTagName("*").length,
      resourceCount: resources.length,
      totalTransferSizeKb: Math.round(
        resources.reduce((acc, r) => acc + (r.transferSize || 0), 0) / 1024,
      ),
    };
  });
}
