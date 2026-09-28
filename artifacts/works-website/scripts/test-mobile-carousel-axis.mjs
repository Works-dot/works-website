import assert from "node:assert/strict";
import { chromium } from "playwright";

// Uses an existing server; CDP input exercises native touch scrolling, not
// synthetic DOM TouchEvents or programmatic scrollTo as a swipe substitute.
const baseUrl = process.env.MOBILE_WIDTH_TEST_URL || "http://localhost:80";
const compareOriginal = process.env.CAROUSEL_AXIS_COMPARE === "1";
const browser = await chromium.launch({ headless: true });

async function measure(track) {
  return track.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      top: element.scrollTop,
      left: element.scrollLeft,
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
      pageY: scrollY,
      pageX: scrollX,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
      relativeTop: element.firstElementChild.getBoundingClientRect().top - bounds.top,
      overflowY: getComputedStyle(element).overflowY,
    };
  });
}

async function position(page, track) {
  await track.evaluate((element) => {
    element.scrollTo({ left: 0, top: 0, behavior: "instant" });
    window.scrollTo({
      top: scrollY + element.getBoundingClientRect().top - 170,
      behavior: "instant",
    });
  });
  await page.waitForTimeout(450);
}

async function swipe(page, cdp, track, dx, dy) {
  const box = await track.boundingBox();
  assert.ok(box, "Missing track");
  const x = box.width * 0.8;
  const y = Math.min(550, box.y + box.height * 0.6);
  const samples = [await measure(track)];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 12; step++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + dx * step / 12, y: y + dy * step / 12 }],
    });
    await page.waitForTimeout(25);
    samples.push(await measure(track));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
  samples.push(await measure(track));
  return samples;
}

function stableTrack(samples, label) {
  for (const sample of samples) {
    assert.equal(sample.top, 0, `${label}: track scrollTop; ${JSON.stringify(sample)}`);
    assert.ok(Math.abs(sample.relativeTop) <= 1, `${label}: card moved vertically`);
    assert.equal(sample.pageX, 0, `${label}: page scrolled horizontally`);
    assert.equal(sample.documentWidth, sample.viewportWidth, `${label}: expanded viewport`);
  }
}

try {
  for (const width of [320, 390, 430]) {
    for (const route of ["/", "/en", ...(width === 390 ? ["/szolgaltatasok/ux-ui-design"] : [])]) {
      const page = await browser.newPage({
        viewport: { width, height: 844 }, isMobile: true, hasTouch: true,
      });
      try {
        const cdp = await page.context().newCDPSession(page);
        const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle" });
        assert.equal(response.status(), 200);
        const reject = page.getByTestId("button-cookie-reject");
        if (await reject.isVisible()) await reject.click();
        await page.evaluate(() => document.fonts.ready);
        const tracks = page.locator("main .overflow-x-auto");
        const isHome = route === "/" || route === "/en";
        assert.ok(await tracks.count() >= (isHome ? 2 : 1), "Shared carousels missing");
        for (const track of await tracks.all()) {
          if (!await track.isVisible()) continue;
          await position(page, track);
          const label = `${route} ${width} ${await track.evaluate(e => e.closest("section")?.id)}`;
          const hasMultipleCards = await track.evaluate(e => e.children.length > 1);
          if (compareOriginal && route === "/" && width === 390 &&
              await track.evaluate(e => e.closest("section")?.id === "blog")) {
            // Controlled A/B: restore only the original implicit overflow-y:auto.
            await track.evaluate(e => { e.style.overflowY = "auto"; });
            const original = await swipe(page, cdp, track, 0, -144);
            console.log("ORIGINAL", JSON.stringify({ before: original[0], after: original.at(-1) }));
            assert.ok(original.at(-1).top > 50, "Original vertical drift not reproduced");
            assert.equal(original.at(-1).pageY, original[0].pageY, "Original page unexpectedly scrolled");
            await track.evaluate(e => { e.style.removeProperty("overflow-y"); });
            await position(page, track);
          }
          assert.equal((await measure(track)).overflowY, "hidden", `${label}: vertical overflow not hidden`);
          const vertical = await swipe(page, cdp, track, 0, -144);
          stableTrack(vertical, `${label} vertical`);
          assert.ok(vertical.at(-1).pageY > vertical[0].pageY + 50, `${label}: page vertical gesture trapped`);
          const downward = await swipe(page, cdp, track, 0, 110);
          stableTrack(downward, `${label} downward`);
          assert.ok(downward.at(-1).pageY < downward[0].pageY - 50, `${label}: page downward gesture trapped`);
          await position(page, track);
          const horizontal = await swipe(page, cdp, track, -width * 0.6, 0);
          stableTrack(horizontal, `${label} horizontal`);
          assert.ok(hasMultipleCards ? horizontal.at(-1).left > 50 : horizontal.at(-1).left === 0,
            `${label}: horizontal swipe failed: ${JSON.stringify(horizontal)}`);
          await position(page, track);
          const diagonal = await swipe(page, cdp, track, -width * 0.6, -50);
          stableTrack(diagonal, `${label} diagonal`);
          assert.ok(hasMultipleCards ? diagonal.at(-1).left > 50 : diagonal.at(-1).left === 0,
            `${label}: diagonal horizontal swipe failed`);
          const region = track.locator("..");
          const dots = region.locator("button");
          if (hasMultipleCards) {
            await dots.last().tap();
            await page.waitForTimeout(650);
            assert.equal(await dots.last().getAttribute("aria-current"), "true", `${label}: last dot`);
            stableTrack([await measure(track)], `${label} dot navigation`);
            await dots.first().tap();
            await page.waitForTimeout(650);
            assert.equal(await dots.first().getAttribute("aria-current"), "true", `${label}: first dot`);
          } else {
            assert.equal(await dots.count(), 0, `${label}: single card should not have dots`);
          }
          console.log("PASS", label, JSON.stringify({
            verticalBefore: vertical[0], verticalAfter: vertical.at(-1),
            horizontalLeft: horizontal.at(-1).left, diagonalLeft: diagonal.at(-1).left,
          }));
        }
        // Actual card navigation with native tap, not merely href inspection.
        const blog = isHome ? page.locator("#blog .overflow-x-auto") : tracks.first();
        await position(page, blog);
        const link = blog.locator("a").first();
        const href = await link.getAttribute("href");
        const box = await blog.boundingBox();
        await page.touchscreen.tap(100, box.y + 80);
        await page.waitForURL(new URL(href, baseUrl).href);
        assert.equal(new URL(page.url()).pathname, new URL(href, baseUrl).pathname);
        console.log("PASS", route, width, "card link", href);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}