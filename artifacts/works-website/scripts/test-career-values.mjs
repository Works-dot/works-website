import assert from "node:assert/strict";
import { chromium } from "playwright";
const DESKTOP = 1024;
const WIDTHS = [390, 768, 1440];
function parseBaseUrl(argv) {
  const i = argv.findIndex((arg) => arg === "--base-url" || arg.startsWith("--base-url="));
  const value = argv[i] === "--base-url" ? argv[i + 1] : argv[i]?.slice(11);
  if (!value) throw new Error("Usage: node scripts/test-career-values.mjs --base-url http://127.0.0.1:5000");
  const url = new URL(value); assert.ok(["http:", "https:"].includes(url.protocol), "The base URL must use http or https");
  return url.toString().replace(/\/+$/, "");
}

const baseUrl = parseBaseUrl(process.argv.slice(2));
const pageUrl = (pathname) => new URL(pathname, `${baseUrl}/`).toString();
const apiUrl = (locale) =>
  `${baseUrl}/strapi/api/career-page?populate[0]=whyUs.items.image&locale=${locale}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

async function readApi(page, locale) {
  return page.evaluate(async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    const body = await response.text();
    if (!response.ok) throw new Error(`Career CMS API failed (${response.status}); cache fallback is not accepted: ${body.slice(0, 200)}`);
    try {
      return JSON.parse(body);
    } catch { throw new Error("Career CMS API returned invalid JSON; cache fallback is not accepted"); }
  }, apiUrl(locale));
}

function recordItems(body) {
  const root = body?.data ?? body;
  const record = root?.attributes ?? root;
  const whyUs = record?.whyUs?.data?.attributes ?? record?.whyUs?.attributes ?? record?.whyUs;
  const items = whyUs?.items?.data ?? whyUs?.items ?? [];
  return (Array.isArray(items) ? items : []).map((item) => {
    const value = item?.attributes ?? item;
    const image = value?.image?.data?.attributes ?? value?.image?.attributes ?? value?.image;
    return { title: String(value?.title ?? ""), description: String(value?.description ?? ""),
      image: typeof image?.url === "string" ? image.url : null };
  });
}

function imageUrl(url) {
  if (!url) return null;
  return new URL(url.startsWith("/strapi/") ? url : `/strapi${url}`, baseUrl).href;
}

function fixtureBody(body, items) {
  const result = clone(body);
  const root = result.data ?? result;
  const record = root?.attributes ?? root;
  const oldSection = record?.whyUs?.data?.attributes ?? record?.whyUs?.attributes ?? record?.whyUs ?? {};
  record.whyUs = { ...oldSection, items: items.map((item) => ({
    title: item.title, description: item.description, image: item.image ? { url: item.image } : null,
  })) };
  return result;
}

async function waitForRows(page, expected) {
  await page.waitForFunction(({ count, titles }) => {
    const text = (element) => { if (!element) return null; const copy = element.cloneNode(true);
      copy.querySelectorAll(".sr-only").forEach((node) => node.remove()); return copy.textContent.trim(); };
    const rows = [...document.querySelectorAll('[data-testid="career-value-row"]')];
    return rows.length === count && rows.every((row, i) => text(row.querySelector('[data-testid="career-value-text"] h3')) === titles[i]);
  }, { count: expected.length, titles: expected.map((item) => item.title.trim()) });
}

async function assertValues(page, expected, width, label) {
  const section = page.getByTestId("career-values");
  await section.waitFor({ state: "visible" });
  await waitForRows(page, expected);
  const rows = section.getByTestId("career-value-row");
  assert.equal(await rows.count(), expected.length, `${label}: row count`);
  assert.equal(await section.locator("button").count(), 0, `${label}: carousel button`);
  const overflow = await section.evaluate((element) => ({
    section: element.scrollWidth - element.clientWidth,
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  assert.ok(overflow.section <= 1 && overflow.page <= 1, `${label}: horizontal overflow`);

  for (let i = 0; i < expected.length; i++) {
    const row = rows.nth(i);
    const value = expected[i];
    const title = row.locator('[data-testid="career-value-text"] h3').first();
    const description = row.locator('[data-testid="career-value-text"] p').first();
    const visibleText = async (locator) => locator.evaluate((element) => {
      const copy = element.cloneNode(true);
      copy.querySelectorAll(".sr-only").forEach((node) => node.remove());
      return copy.textContent.trim();
    });
    assert.equal(await visibleText(title), value.title.trim(), `${label}: title ${i}`);
    const expectedDescription = value.description?.trim() || "";
    if (expectedDescription) {
      assert.equal(await visibleText(description), expectedDescription, `${label}: description ${i}`);
      assert.ok(await description.evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 18), `${label}: description size ${i}`);
    } else {
      assert.equal(await description.count(), 0, `${label}: empty description must not render a paragraph ${i}`);
    }
    assert.ok(await title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 24), `${label}: title size ${i}`);
    if (expectedDescription.length > 200) {
      assert.ok(await description.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 &&
        getComputedStyle(el).overflowY !== "hidden"), `${label}: long description clipped ${i}`);
    }

    const imageRegion = row.getByTestId("career-value-image");
    const textRegion = row.getByTestId("career-value-text");
    const image = imageRegion.locator("img");
    if (value.image) {
      assert.equal(await image.count(), 1, `${label}: missing image ${i}`);
      await image.scrollIntoViewIfNeeded();
      const loaded = await image.evaluate((element) => {
        element.scrollIntoView({ block: "center" });
        if (element.complete) return element.naturalWidth > 0;
        return new Promise((resolve) => {
          element.addEventListener("load", () => resolve(element.naturalWidth > 0), { once: true });
          element.addEventListener("error", () => resolve(false), { once: true });
        });
      });
      assert.equal(loaded, true, `${label}: broken image ${i}`);
      assert.equal(new URL(await image.getAttribute("src"), page.url()).href, imageUrl(value.image),
        `${label}: image source ${i}`);
    } else {
      assert.equal(await image.count(), 0, `${label}: unexpected image ${i}`);
    }

    const [imageBox, textBox] = await Promise.all([imageRegion.boundingBox(), textRegion.boundingBox()]);
    assert.ok(imageBox && textBox, `${label}: missing region geometry ${i}`);
    if (width >= DESKTOP) {
      assert.equal(imageBox.x < textBox.x, i % 2 === 0, `${label}: desktop order ${i}`);
      assert.ok(Math.abs(imageBox.width - textBox.width) <= 1,
        `${label}: equal desktop columns ${i} (${imageBox.width}px / ${textBox.width}px)`);
    } else {
      assert.ok(imageBox.y < textBox.y, `${label}: mobile image-first order ${i}`);
    }
  }
}

function makeFixtures(body) {
  const source = recordItems(body);
  const fallbackImage = source.find((item) => item.image)?.image;
  assert.ok(fallbackImage, "CMS career values need at least one image for fixture coverage");
  const seed = source.slice(0, 4);
  while (seed.length < 4) {
    seed.push({ title: `Regression value ${seed.length + 1}`, description: "Regression fixture value.", image: fallbackImage });
  }
  const four = seed.map((item) => ({ ...item, image: item.image || fallbackImage })).slice(0, 4).reverse();
  four[0].description += " This deliberately long regression description verifies that the value text remains fully visible without clipping, truncation, or a fixed-height carousel card.";
  four[2].image = null;
  four[1].description = null;
  four[3].description = "";
  return [four, [four[0]], []];
}

async function testLocale(context, locale) {
  const path = locale === "hu" ? "/karrier" : "/en/careers";
  const page = await context.newPage();
  await page.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
  const before = await readApi(page, locale);
  const expected = recordItems(before);
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
    await assertValues(page, expected, width, `${locale} ${width}px CMS`);
  }

  const fixturePage = await context.newPage();
  let activeFixture = null;
  await fixturePage.route("**/strapi/api/career-page*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.pathname === "/strapi/api/career-page" && activeFixture)
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(activeFixture) });
    return route.continue();
  });
  for (const [variant, items] of makeFixtures(before).entries()) {
    activeFixture = fixtureBody(before, items);
    for (const width of WIDTHS) {
      await fixturePage.setViewportSize({ width, height: 1000 });
      const served = fixturePage.waitForResponse((response) => new URL(response.url()).pathname === "/strapi/api/career-page");
      await fixturePage.goto(pageUrl(path), { waitUntil: "domcontentloaded" }); await served;
      await assertValues(fixturePage, items, width, `${locale} ${width}px fixture ${variant}`);
    }
  }
  await fixturePage.unroute("**/strapi/api/career-page*");
  const after = await readApi(page, locale);
  assert.deepEqual(after, before, `${locale}: read-only CMS API changed during regression`);
  await fixturePage.close();
  await page.close();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    for (const locale of ["hu", "en"]) await testLocale(context, locale);
    console.log(`✓ Career values regression passed (${baseUrl})`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});