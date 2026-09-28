import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright";

// Point at an already-running preview or a built website server; never starts one.
const baseUrl = process.env.MOBILE_WIDTH_TEST_URL || "http://localhost:80";
const screenshotDir = process.env.MOBILE_WIDTH_SCREENSHOT_DIR;
const engines = process.env.MOBILE_WIDTH_ENGINES?.split(",") || ["chromium"];
const cases = [
  ...[320, 360, 390, 412, 430].flatMap((width) =>
    ["/", "/en"].map((route) => ({ width, height: 844, route, mobile: true })),
  ),
  { width: 844, height: 390, route: "/", mobile: true },
  { width: 1440, height: 900, route: "/", mobile: false },
];

async function metrics(page) {
  return page.evaluate(() => {
    const bounds = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    };
    return {
      layout: innerWidth,
      visual: visualViewport?.width ?? innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      scrollX,
      visualOffset: visualViewport?.offsetLeft ?? 0,
      root: bounds("#root"),
      main: bounds("main"),
      hero: bounds(".full-bleed-hero"),
      header: bounds("header"),
      sections: [...document.querySelectorAll("main > section")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { id: element.id, left: rect.left, width: rect.width };
      }),
    };
  });
}

async function assertWidth(page, width, context) {
  const result = await metrics(page);
  const near = (value, expected, label) =>
    assert.ok(
      value != null && Math.abs(value - expected) <= 1.5,
      `${context}: ${label} expected ${expected}, got ${value}; ${JSON.stringify(result)}`,
    );
  near(result.visual, width, "visual viewport");
  near(result.layout, width, "layout viewport");
  near(result.document, width, "document scroll width");
  near(result.body, width, "body scroll width");
  for (const name of ["root", "main", "hero", "header"]) {
    near(result[name]?.left, 0, `${name} left`);
    near(result[name]?.width, width, `${name} width`);
  }
  assert.ok(result.sections.length >= 6, `${context}: homepage sections are missing`);
  for (const section of result.sections) {
    near(section.left, 0, `${section.id || "section"} left`);
    near(section.width, width, `${section.id || "section"} width`);
  }
  near(result.scrollX, 0, "window horizontal scroll");
  near(result.visualOffset, 0, "visual viewport horizontal offset");
}

for (const engineName of engines) {
  const engine = { chromium, webkit }[engineName];
  assert.ok(engine, `Unknown engine: ${engineName}`);
  const browser = await engine.launch({ headless: true });
  try {
    for (const test of cases) {
      const page = await browser.newPage({
        viewport: { width: test.width, height: test.height },
        isMobile: test.mobile,
        hasTouch: test.mobile,
        deviceScaleFactor: test.mobile ? 2 : 1,
      });
      const label = `${engineName} ${test.width}x${test.height} ${test.route}`;
      try {
        const response = await page.goto(new URL(test.route, baseUrl).href, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        assert.equal(response?.status(), 200, `${label}: document request failed`);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].filter((image) => image.complete).map((image) =>
            image.decode().catch(() => undefined),
          ));
        });
        await page.waitForTimeout(350); // allow the animated/async homepage to settle
        await assertWidth(page, test.width, `${label} initial`);

        for (const section of await page.locator("main > section").all()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(100);
          await assertWidth(page, test.width, `${label} scrolled section`);
        }
        await page.evaluate(() => window.scrollTo({ left: 500, behavior: "instant" }));
        await assertWidth(page, test.width, `${label} after horizontal scroll attempt`);

        if (test.mobile && test.width === 390) {
          // Cards still scroll inside their own snap track.
          const track = page.locator("#blog .overflow-x-auto");
          await track.evaluate((element) => element.scrollTo({ left: 400, behavior: "instant" }));
          await page.waitForTimeout(150);
          assert.ok(await track.evaluate((element) => element.scrollLeft > 0), `${label}: blog carousel cannot scroll`);
          await assertWidth(page, test.width, `${label} after carousel scroll`);
          await page.getByTestId("nav-mobile-toggle").click();
          await page.waitForTimeout(350);
          await assertWidth(page, test.width, `${label} mobile menu open`);
          await page.getByTestId("nav-mobile-services-trigger").click();
          await page.waitForTimeout(250);
          await assertWidth(page, test.width, `${label} mobile services open`);
          await page.getByTestId("nav-mobile-toggle").click();
          await page.waitForTimeout(400);
          await assertWidth(page, test.width, `${label} mobile menu closed`);
        }
        if (screenshotDir && test.mobile && test.width === 390) {
          await fs.mkdir(screenshotDir, { recursive: true });
          const cookieReject = page.getByTestId("button-cookie-reject");
          if (await cookieReject.isVisible()) await cookieReject.click();
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await page.screenshot({
            path: path.join(screenshotDir, `task236-${engineName}-${test.route === "/" ? "hu" : "en"}-390.jpg`),
            type: "jpeg",
            quality: 80,
          });
        }
        console.log(`PASS ${label}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}