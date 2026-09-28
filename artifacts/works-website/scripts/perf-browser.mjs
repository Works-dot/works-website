import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const baseUrl = process.env.PERF_BASE_URL || "http://127.0.0.1:8080";
const label = process.env.PERF_LABEL || "production";
const outputPath =
  process.env.PERF_OUTPUT ||
  path.resolve("/tmp", `works-performance-${label}.json`);
const routes = [
  { name: "hu-home", path: "/" },
  { name: "en-home", path: "/en" },
  { name: "service", path: "/szolgaltatasok/ux-kutatas" },
  {
    name: "project",
    path: "/projektek/ux-kutatassal-megalapozott-biztositasi-ugyfelportal",
  },
  {
    name: "blog",
    path: "/blog/bizzuk-az-ai-ra-a-felhasznaloi-visszajelzesek-elemzeset",
  },
  { name: "career", path: "/karrier" },
];
const viewports = [
  { name: "mobile", width: 390, height: 844, isMobile: true },
  { name: "desktop", width: 1440, height: 900, isMobile: false },
];

async function measureRoute(browser, viewport, route) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const failures = [];
  const httpErrors = [];

  page.on("requestfailed", (request) => {
    failures.push({
      url: request.url(),
      error: request.failure()?.errorText || "unknown",
    });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      httpErrors.push({ url: response.url(), status: response.status() });
    }
  });
  await page.addInitScript(() => {
    window.__worksLargestContentfulPaint = 0;
    window.__worksCumulativeLayoutShift = 0;
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) window.__worksLargestContentfulPaint = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__worksCumulativeLayoutShift += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Unsupported observers are represented as null in the report.
      window.__worksLargestContentfulPaint = null;
      window.__worksCumulativeLayoutShift = null;
    }
  });

  const url = new URL(route.path, baseUrl).toString();
  let navigationError = null;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    // Allow the final LCP candidate and delayed layout shifts to be observed.
    await page.waitForTimeout(500);
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const transferred = (entry) => entry.transferSize || entry.encodedBodySize || 0;
    const scripts = resources.filter((entry) => entry.initiatorType === "script");
    const images = resources.filter((entry) => entry.initiatorType === "img");
    return {
      lcpMs: window.__worksLargestContentfulPaint,
      cls: window.__worksCumulativeLayoutShift,
      navigation: navigation
        ? {
            responseEndMs: navigation.responseEnd,
            domContentLoadedMs: navigation.domContentLoadedEventEnd,
            loadEventEndMs: navigation.loadEventEnd,
          }
        : null,
      resources: resources.length,
      transferredBytes: resources.reduce((sum, entry) => sum + transferred(entry), 0),
      jsTransferredBytes: scripts.reduce((sum, entry) => sum + transferred(entry), 0),
      imageTransferredBytes: images.reduce((sum, entry) => sum + transferred(entry), 0),
      imageRequests: images.length,
    };
  });

  await context.close();
  return {
    route: route.path,
    viewport: viewport.name,
    url,
    ...metrics,
    failures,
    httpErrors,
    navigationError,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of viewports) {
    for (const route of routes) {
      const result = await measureRoute(browser, viewport, route);
      results.push({ name: route.name, ...result });
      console.log(
        `${viewport.name.padEnd(7)} ${route.name.padEnd(8)} ` +
          `LCP=${result.lcpMs === null ? "n/a" : `${Math.round(result.lcpMs)}ms`} ` +
          `CLS=${result.cls === null ? "n/a" : result.cls.toFixed(3)} ` +
          `bytes=${result.transferredBytes}`,
      );
    }
  }
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    label,
    routes,
    viewports,
    caveats: [
      "Each route uses a fresh Chromium context and service workers are blocked.",
      "No CPU or network throttling is applied; results describe this local lab only.",
      "Transferred bytes use Resource Timing transferSize when available and fall back to encodedBodySize.",
    ],
    targets: { lcpMs: 2500, cls: 0.1 },
    results,
  };
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});