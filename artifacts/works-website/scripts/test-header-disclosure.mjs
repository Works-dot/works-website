import assert from "node:assert/strict";
import { chromium } from "playwright";

function parseBaseUrl(argv) {
  const argument = argv.find((value) => value === "--base-url" || value.startsWith("--base-url="));
  const value = argument === "--base-url"
    ? argv[argv.indexOf(argument) + 1]
    : argument?.slice("--base-url=".length);

  if (!value) {
    throw new Error(
      "Usage: node scripts/test-header-disclosure.mjs --base-url http://127.0.0.1:5000",
    );
  }

  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`The base URL must use http or https: ${value}`);
  }
  return url.toString().replace(/\/+$/, "");
}

const baseUrl = parseBaseUrl(process.argv.slice(2));

function urlFor(pathname) {
  return new URL(pathname, `${baseUrl}/`).toString();
}

async function waitForExpanded(page, trigger, expected) {
  await trigger.waitFor({ state: "visible" });
  await page.waitForFunction(
    ({ testId, value }) =>
      document.querySelector(`[data-testid="${testId}"]`)?.getAttribute("aria-expanded") === value,
    { testId: await trigger.getAttribute("data-testid"), value: String(expected) },
  );
  assert.equal(await trigger.getAttribute("aria-expanded"), String(expected));
}

async function assertFocused(page, testId) {
  await page.waitForFunction(
    (expectedTestId) => document.activeElement?.getAttribute("data-testid") === expectedTestId,
    testId,
  );
}

async function assertExitingPanelIsInert(page, selector) {
  await page.waitForFunction((panelSelector) => {
    const panel = document.querySelector(panelSelector);
    if (!panel) return true;
    return (
      panel.getAttribute("aria-hidden") === "true" &&
      panel.hasAttribute("inert")
    );
  }, selector);
  // Ancestor inertness also protects descendants in nested AnimatePresence
  // boundaries; those descendants need not each have their tabindex rewritten.
  assert.equal(await page.evaluate((panelSelector) => {
    const panel = document.querySelector(panelSelector);
    if (!panel) return true;
    for (const element of panel.querySelectorAll("a, button")) {
      element.focus();
      if (document.activeElement === element) return false;
    }
    return !panel.contains(document.activeElement);
  }, selector), true, "Closed panels must not accept focus during their exit");
}

async function assertLocaleServiceLinks(page, selector, locale) {
  const links = page.locator(`${selector} a`);
  const count = await links.count();
  assert.ok(count > 0, `${locale.toUpperCase()} service disclosure has no links`);

  const hrefs = await links.evaluateAll((anchors) =>
    anchors.map((anchor) => anchor.getAttribute("href")),
  );
  const prefix = locale === "hu" ? "/szolgaltatasok/" : "/en/services/";
  for (const href of hrefs) {
    assert.ok(href?.startsWith(prefix), `${locale.toUpperCase()} service link has wrong href: ${href}`);
  }
}

async function openDesktop(page) {
  const trigger = page.getByTestId("nav-services-trigger");
  await trigger.focus();
  await page.keyboard.press("Enter");
  await waitForExpanded(page, trigger, true);
  await page.locator("#desktop-services-disclosure").waitFor({ state: "visible" });
  return { trigger, panel: page.locator("#desktop-services-disclosure") };
}

async function testDesktopLocale(page, locale) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(urlFor(locale === "hu" ? "/" : "/en"), { waitUntil: "domcontentloaded" });

  const trigger = page.getByTestId("nav-services-trigger");
  await trigger.waitFor({ state: "visible" });
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  assert.equal(
    await trigger.getAttribute("aria-controls"),
    "desktop-services-disclosure",
  );
  await page.locator("header a").first().focus();
  await page.keyboard.press("Tab");
  await assertFocused(page, "nav-services-trigger");
  await page.keyboard.press("Space");
  await waitForExpanded(page, trigger, true);
  await page.keyboard.press("Space");
  await waitForExpanded(page, trigger, false);
  await page.locator("#desktop-services-disclosure").waitFor({ state: "detached" });

  const { panel } = await openDesktop(page);
  assert.equal(await trigger.evaluate(e => {
    const style = getComputedStyle(e);
    return e.matches(":focus-visible") && parseFloat(style.outlineWidth) >= 2;
  }), true, "Keyboard focus must have a visible outline");
  if (locale === "hu") await page.screenshot({ path: "/tmp/header-keyboard-focus.png" });
  await assertLocaleServiceLinks(page, "#desktop-services-disclosure", locale);
  assert.equal(
    await page.locator("header [role='menu'], header [role='menuitem']").count(),
    0,
    "The disclosure must not claim menu roles without menu keyboard behavior",
  );

  const firstLink = panel.locator("a").first();
  await page.keyboard.press("Tab");
  await assertFocused(page, await firstLink.getAttribute("data-testid"));
  await page.keyboard.press("Shift+Tab");
  await assertFocused(page, "nav-services-trigger");

  await page.keyboard.press("Enter");
  await waitForExpanded(page, trigger, false);
  await assertFocused(page, "nav-services-trigger");
  await assertExitingPanelIsInert(page, "#desktop-services-disclosure");
  await panel.waitFor({ state: "detached" });

  const reopened = await openDesktop(page);
  await reopened.panel.locator("a").first().focus();
  await page.keyboard.press("Escape");
  await waitForExpanded(page, trigger, false);
  await assertFocused(page, "nav-services-trigger");
  await assertExitingPanelIsInert(page, "#desktop-services-disclosure");
  await reopened.panel.waitFor({ state: "detached" });

  const outsideClick = await openDesktop(page);
  await page.mouse.click(1200, 900);
  await waitForExpanded(page, trigger, false);
  await outsideClick.panel.waitFor({ state: "detached" });

  const tabbed = await openDesktop(page);
  await tabbed.panel.locator("a").last().focus();
  await page.keyboard.press("Tab");
  await waitForExpanded(page, trigger, false);
  assert.notEqual(
    await page.evaluate(() => Boolean(document.activeElement?.closest("#desktop-services-disclosure"))),
    true,
    "Tabbing out must not leave focus inside the exiting disclosure",
  );
  await tabbed.panel.waitFor({ state: "detached" });

  await trigger.hover();
  await waitForExpanded(page, trigger, true);
  await trigger.click();
  await waitForExpanded(page, trigger, true);
  await page.keyboard.press("Enter");
  await waitForExpanded(page, trigger, false);
  await page.locator("#desktop-services-disclosure").waitFor({ state: "detached" });

  const keyboardOpened = await openDesktop(page);
  await keyboardOpened.panel.locator("a").first().focus();
  await page.mouse.move(1200, 900);
  await page.waitForTimeout(250);
  await waitForExpanded(page, trigger, true);
  await keyboardOpened.panel.locator("a").first().focus();
  await page.keyboard.press("Escape");
  await keyboardOpened.panel.waitFor({ state: "detached" });

  const routeTest = await openDesktop(page);
  const routeHref = await routeTest.panel.locator("a").first().getAttribute("href");
  assert.ok(routeHref, `${locale.toUpperCase()} desktop service link href is missing`);
  await routeTest.panel.locator("a").first().focus();
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.pathname === new URL(routeHref, baseUrl).pathname);
  assert.equal(await page.getByTestId("nav-services-trigger").getAttribute("aria-expanded"), "false");
}

async function testMobileLocale(page, locale) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(urlFor(locale === "hu" ? "/" : "/en"), { waitUntil: "domcontentloaded" });

  const menuToggle = page.getByTestId("nav-mobile-toggle");
  await menuToggle.waitFor({ state: "visible" });
  await menuToggle.click();

  const mobileMenu = page.locator("#mobile-menu");
  const servicesTrigger = page.getByTestId("nav-mobile-services-trigger");
  await mobileMenu.waitFor({ state: "visible" });
  assert.equal(await menuToggle.getAttribute("aria-controls"), "mobile-menu");
  assert.equal(await servicesTrigger.getAttribute("aria-expanded"), "false");
  assert.equal(
    await servicesTrigger.getAttribute("aria-controls"),
    "mobile-services-disclosure",
  );

  await servicesTrigger.click();
  await waitForExpanded(page, servicesTrigger, true);
  await page.locator("#mobile-services-disclosure").waitFor({ state: "visible" });
  await assertLocaleServiceLinks(page, "#mobile-services-disclosure", locale);

  const firstLink = page.locator("#mobile-services-disclosure a").first();
  await servicesTrigger.focus();
  await page.keyboard.press("Space");
  await waitForExpanded(page, servicesTrigger, false);
  await page.locator("#mobile-services-disclosure").waitFor({ state: "detached" });
  await page.keyboard.press("Enter");
  await waitForExpanded(page, servicesTrigger, true);
  await page.keyboard.press("Tab");
  await assertFocused(page, await firstLink.getAttribute("data-testid"));
  await firstLink.focus();
  await page.keyboard.press("Escape");
  await waitForExpanded(page, servicesTrigger, false);
  await assertFocused(page, "nav-mobile-services-trigger");

  await page.keyboard.press("Escape");
  await waitForExpanded(page, menuToggle, false);
  await assertFocused(page, "nav-mobile-toggle");
  await assertExitingPanelIsInert(page, "#mobile-menu");
  await mobileMenu.waitFor({ state: "detached" });

  await menuToggle.click();
  await servicesTrigger.click();
  await menuToggle.click();
  await waitForExpanded(page, menuToggle, false);
  assert.equal(await servicesTrigger.getAttribute("aria-expanded"), "false");
  await assertFocused(page, "nav-mobile-toggle");
  await assertExitingPanelIsInert(page, "#mobile-menu");
  await mobileMenu.waitFor({ state: "detached" });

  await menuToggle.click();
  await servicesTrigger.click();
  const serviceHref = await page.locator("#mobile-services-disclosure a").first().getAttribute("href");
  assert.ok(serviceHref, "The mobile service link href is missing");
  await page.locator("#mobile-services-disclosure a").first().click();
  await page.waitForURL((url) => url.pathname === new URL(serviceHref, baseUrl).pathname);
  assert.equal(await menuToggle.getAttribute("aria-expanded"), "false");
  // Each route mounts its own Header: navigation removes the old trigger too.
  // Require safe focus on the destination, not the unmounted trigger.
  assert.equal(await page.evaluate(() => {
    const active = document.activeElement;
    return !!active?.isConnected && !active.closest('[inert], [aria-hidden="true"], #mobile-menu');
  }), true);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    for (const locale of ["hu", "en"]) {
      await testDesktopLocale(page, locale);
      await testMobileLocale(page, locale);
    }
    console.log(`✓ Header disclosure keyboard, pointer, focus, locale, and exit tests passed (${baseUrl})`);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});