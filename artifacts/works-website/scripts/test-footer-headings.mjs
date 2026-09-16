import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const baseUrl = process.argv[2];
assert.ok(baseUrl && /^https?:\/\//.test(baseUrl), "Pass the running preview URL");
const expected = {
  hu: ["Tartalom lábléc", "Lábléc menü", "Szolgáltatások", "Cég", "Kapcsolat"],
  en: ["Footer content", "Footer menu", "Services", "Company", "Contact"],
};
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  root,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function checkHeadings(locale, checkStyles = false) {
  const footer = page.locator("footer");
  await footer.waitFor({ state: "attached" });
  const headings = await footer.locator("h1,h2,h3,h4,h5,h6").evaluateAll(elements =>
    elements.map(element => ({
      level: element.tagName,
      text: element.textContent.trim(),
      hidden: !!element.closest("[hidden],[aria-hidden=true]"),
      tabIndex: element.getAttribute("tabindex"),
    })),
  );
  assert.deepEqual(headings.map(h => h.level), ["H2", "H3", "H3", "H4", "H4", "H4"]);
  assert.deepEqual(headings.filter((_, i) => i !== 1).map(h => h.text), expected[locale]);
  assert.ok(headings[1].text.length > 0, "CMS newsletter title retained");
  assert.ok(headings.every(h => !h.hidden && h.tabIndex === null));
  const hiddenHeadings = footer.locator("h2.sr-only,h3.sr-only");
  assert.equal(await hiddenHeadings.count(), 2);
  const accessibility = await footer.ariaSnapshot();
  for (const text of expected[locale]) assert.ok(accessibility.includes(text), text);
  const lists = await footer.locator("ul").evaluateAll(elements => elements.map(list => ({
    role: list.getAttribute("role"),
    items: [...list.children].map(item => ({
      tag: item.tagName,
      position: Number(item.getAttribute("aria-posinset")),
      size: Number(item.getAttribute("aria-setsize")),
    })),
  })));
  assert.equal(lists.length, 3);
  for (const list of lists) {
    assert.equal(list.role, "list");
    list.items.forEach((item, index) => {
      assert.equal(item.tag, "LI");
      assert.equal(item.position, index + 1);
      assert.equal(item.size, list.items.length);
    });
  }
  assert.equal(await footer.locator("a[aria-posinset],a[aria-setsize]").count(), 0);
  if (checkStyles) {
    const styles = await hiddenHeadings.evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      return { position: style.position, width: style.width, height: style.height,
        display: style.display, visibility: style.visibility, lang: element.closest("[lang]")?.lang };
    }));
    for (const style of styles) {
      assert.equal(style.position, "absolute");
      assert.equal(style.width, "1px");
      assert.equal(style.height, "1px");
      assert.notEqual(style.display, "none");
      assert.equal(style.visibility, "visible");
      assert.equal(style.lang, locale);
    }
    // Removing visually hidden headings must not move the visible footer.
    const before = await footer.boundingBox();
    await hiddenHeadings.evaluateAll(elements => elements.forEach(e => e.style.display = "none"));
    assert.deepEqual(await footer.boundingBox(), before);
    await hiddenHeadings.evaluateAll(elements => elements.forEach(e => e.style.removeProperty("display")));
  }
}

try {
  const { render, getLocaleFallback } = await vite.ssrLoadModule("/src/entry-server.tsx");
  for (const locale of ["hu", "en"]) {
    await page.setContent(`<html lang="${locale}"><body>${render(locale === "hu" ? "/" : "/en").html}</body></html>`);
    await checkHeadings(locale);
    const services = getLocaleFallback("footerServices", locale);
    const legal = getLocaleFallback("legalDocuments", locale);
    const originalServices = [...services];
    const originalImprint = legal.imprintPdfUrl;
    try {
      for (const count of [2, 0]) {
        services.splice(0, services.length, ...originalServices.slice(0, count));
        legal.imprintPdfUrl = count ? "/test-imprint.pdf" : "";
        await page.setContent(`<html lang="${locale}"><body>${render(locale === "hu" ? "/" : "/en").html}</body></html>`);
        await checkHeadings(locale);
        assert.equal(await page.locator("footer ul").first().locator("li").count(), count || 4);
        assert.equal(await page.locator('footer a[href="/test-imprint.pdf"]').count(), count ? 1 : 0);
      }
    } finally {
      services.splice(0, services.length, ...originalServices);
      legal.imprintPdfUrl = originalImprint;
    }
  }
  await vite.close();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["hu", "en"]) {
      await page.goto(new URL(locale === "hu" ? "./" : "./en", baseUrl).href);
      await page.waitForFunction(lang => document.documentElement.lang === lang, locale);
      await checkHeadings(locale, true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseUrl);
  await page.locator('header a[lang="en"]').filter({ visible: true }).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await checkHeadings("en", true);
  await page.locator('header a[lang="hu"]').filter({ visible: true }).first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.lang === "hu");
  await checkHeadings("hu", true);
  console.log("Footer: HU/EN SSR, list positions including shorter/fallback lists, optional imprint, responsive DOM, headings and language switching passed.");
  console.log("This verifies markup and accessibility exposure, not synthesized screen-reader speech.");
} finally {
  await browser.close();
  await vite.close();
}