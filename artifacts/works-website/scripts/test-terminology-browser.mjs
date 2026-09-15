import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

// Explicit target: this script never starts a server or publishes a build.
const baseUrl = process.argv[2];
const labelsOnly = process.argv.includes("--labels-only");
assert.ok(baseUrl && /^https?:\/\//.test(baseUrl), "Pass the running preview URL");
const cache = JSON.parse(readFileSync(new URL("../src/data/strapi-cache.json", import.meta.url)));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
let visited = 0;

try {
  for (const locale of ["hu", "en"]) {
    const en = locale === "en";
    const routes = en
      ? ["/en", "/en/about", "/en/careers", "/en/contact", "/en/cookies", "/en/projects", "/en/blog"]
      : ["/", "/rolunk", "/karrier", "/kapcsolat", "/sutik", "/projektek", "/blog"];
    routes.push(...cache[locale].services.map(s => `${en ? "/en/services/" : "/szolgaltatasok/"}${s.slug}`));
    routes.push(`${en ? "/en/projects/" : "/projektek/"}${cache[locale].projects[0].slug}`);
    routes.push(`${en ? "/en/blog/" : "/blog/"}${cache[locale].blogPosts[0].slug}`);
    if (cache[locale].careerPositions?.length) {
      routes.push(`${en ? "/en/careers/" : "/karrier/"}${cache[locale].careerPositions[0].slug}`);
    }
    for (const route of labelsOnly ? [] : routes) {
      const response = await page.goto(new URL(route, baseUrl).href);
      assert.equal(response.status(), 200, route);
      await page.waitForFunction(lang => document.documentElement.lang === lang, locale);
      await page.locator("main h1").waitFor();
      const markup = await page.evaluate(() => ({
        generated: document.querySelectorAll("[data-terminology]").length,
        language: [...document.querySelectorAll("[data-terminology] > span[lang]")].every(e => e.lang === "en"),
        hiddenNames: document.querySelectorAll("[data-terminology][aria-label]").length,
        nested: document.querySelectorAll("[data-terminology] [data-terminology]").length,
        brokenAlt: [...document.images].some(i => /<span|&lt;span/.test(i.alt)),
      }));
      assert.ok(markup.generated > 0, `${route}: terminology not rendered`);
      assert.equal(markup.language, true, route);
      assert.equal(markup.hiddenNames, 0, route);
      assert.equal(markup.nested, 0, route);
      assert.equal(markup.brokenAlt, false, route);
      visited++;
    }

    await page.goto(new URL(en ? "/en" : "/", baseUrl).href);
    const trigger = page.getByTestId("nav-services-trigger");
    await trigger.focus();
    await page.keyboard.press("Enter");
    const firstLink = page.locator("#desktop-services-disclosure a").first();
    await firstLink.waitFor();
    const snapshot = await firstLink.ariaSnapshot();
    const definition = en ? "user experience" : "felhasználói élmény";
    assert.ok(snapshot.includes("UX"), "Visible abbreviation must remain in the link name");
    assert.ok(snapshot.includes(definition), "Localized definition must be exposed");
    const nameLine = snapshot.split("\n")[0];
    const visibleLabel = await firstLink.evaluate(element => {
      const copy = element.cloneNode(true);
      copy.querySelectorAll(".sr-only").forEach(e => e.remove());
      return copy.textContent.trim();
    });
    assert.ok(nameLine.includes(visibleLabel), "The complete visible link label must remain contiguous");
    assert.equal(nameLine.split(definition).length - 1, 1, "One definition per link name");
    assert.equal(await firstLink.locator('span[lang="en"]').first().textContent(), "UX");
    await page.keyboard.press("Escape");

    await page.goto(new URL(en ? "/en/contact" : "/kapcsolat", baseUrl).href);
    for (const option of await page.locator("select option").all()) {
      const text = (await option.textContent()) || "";
      const name = await option.getAttribute("aria-label");
      if (name) assert.ok(name.startsWith(text), "Option accessible name must preserve its visible label");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId("nav-mobile-toggle").click();
    await page.getByTestId("nav-mobile-services-trigger").click();
    const mobileLink = page.locator("#mobile-services-disclosure a").first();
    await mobileLink.waitFor();
    assert.ok((await mobileLink.ariaSnapshot()).includes(definition));
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  assert.deepEqual(errors, [], "No runtime or hydration errors");
  console.log(`PASS: ${labelsOnly ? "focused label regression" : `${visited} HU/EN representative pages`}, desktop/mobile accessible names, localized definitions and option labels.`);
  console.log("This verifies DOM/accessibility output, NOT synthesized speech.");
} finally {
  await browser.close();
}