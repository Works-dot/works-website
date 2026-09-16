import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.argv[2];
assert.ok(baseUrl && /^https?:\/\//.test(baseUrl), "Pass the running preview URL");
const requestedLocale = process.argv[3] ?? "all";
assert.ok(
  requestedLocale === "all" || requestedLocale === "hu" || requestedLocale === "en",
  "Pass an optional locale: hu or en",
);

const expected = {
  hu: {
    path: "/",
    provider: "Értesítés",
    viewport: "Értesítések (F8)",
    close: "Értesítés bezárása",
    title: "Toast teszt",
  },
  en: {
    path: "/en",
    provider: "Notification",
    viewport: "Notifications (F8)",
    close: "Close notification",
    title: "Toast test",
  },
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function importToastHook() {
  // This deliberately uses the development module instead of submitting a
  // form, so the regression covers the shared toast lifecycle directly.
  return page.evaluate(async () => {
    const { toast } = await import("/src/hooks/use-toast.ts");
    window.__toastA11yControl = toast({
      title: document.documentElement.lang === "hu" ? "Toast teszt" : "Toast test",
      description: "Toast accessibility lifecycle",
      duration: Infinity,
    });
  });
}

async function focusOutsideViewport() {
  await page.evaluate(() => {
    const target = document.createElement("button");
    target.type = "button";
    target.textContent = "Toast test focus target";
    target.dataset.toastA11yFocusTarget = "";
    document.body.append(target);
    target.focus();
  });
}

async function runLocale(locale) {
  const copy = expected[locale];
  await page.goto(new URL(copy.path, baseUrl).href);
  await page.waitForFunction((value) => document.documentElement.lang === value, locale);

  const region = page.locator('[role="region"][aria-label*="(F8)"]');
  await region.waitFor({ state: "attached" });
  const owner = await region.evaluate((element) => ({
    role: element.getAttribute("role"),
    name: element.getAttribute("aria-label"),
    tabIndex: element.getAttribute("tabindex"),
    hiddenAncestor: element.closest('[aria-hidden="true"]') !== null,
    parentTagName: element.parentElement?.tagName,
  }));
  assert.deepEqual(owner, {
    role: "region",
    name: copy.viewport,
    tabIndex: "-1",
    hiddenAncestor: true,
    parentTagName: "DIV",
  });

  const emptyAccessibilityTree = await page.locator("body").ariaSnapshot();
  assert.ok(
    !emptyAccessibilityTree.includes(copy.viewport),
    `${locale}: empty toast viewport should not be in the accessibility tree`,
  );

  await page.keyboard.press("F8");
  assert.equal(
    await region.evaluate((element) => element.contains(document.activeElement)),
    false,
    `${locale}: F8 must not focus the empty viewport`,
  );

  await importToastHook();
  const openToast = region.locator('[data-state="open"]');
  await openToast.waitFor({ state: "attached" });
  await page.waitForFunction(
    (label) =>
      document
        .querySelector('[role="region"][aria-label*="(F8)"]')
        ?.closest('[aria-hidden="true"]') === null &&
      document
        .querySelector('[role="region"][aria-label*="(F8)"]')
        ?.getAttribute("aria-label") === label,
    copy.viewport,
  );

  const activeOwner = await region.evaluate((element) => ({
    role: element.getAttribute("role"),
    name: element.getAttribute("aria-label"),
    tabIndex: element.getAttribute("tabindex"),
    hiddenAncestor: element.closest('[aria-hidden="true"]') !== null,
    listTabIndex: element.querySelector("ol")?.getAttribute("tabindex"),
  }));
  assert.deepEqual(activeOwner, {
    role: "region",
    name: copy.viewport,
    tabIndex: "-1",
    hiddenAncestor: false,
    listTabIndex: "-1",
  });

  const closeButton = openToast.getByRole("button", { name: copy.close });
  assert.equal(await closeButton.count(), 1, `${locale}: localized close label`);

  const announcer = page.locator('[role="status"][aria-live="assertive"]');
  await announcer.waitFor({ state: "attached" });
  assert.equal(await announcer.getAttribute("aria-live"), "assertive");
  assert.ok(
    (await announcer.textContent()).includes(copy.provider),
    `${locale}: live announcer keeps the localized provider label`,
  );
  assert.equal(
    await announcer.evaluate((element) => element.closest('[aria-hidden="true"]') === null),
    true,
    `${locale}: live announcer must not be hidden with the viewport`,
  );

  await page.keyboard.press("F8");
  assert.equal(
    await region.evaluate((element) => element.contains(document.activeElement)),
    true,
    `${locale}: F8 focuses an active viewport`,
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await region.evaluate((element) => element.contains(document.activeElement)),
    true,
    `${locale}: keyboard focus stays within the active toast`,
  );
  await page.keyboard.press("Escape");

  const closedToast = region.locator('[data-state="closed"]');
  await closedToast.waitFor({ state: "attached" });
  assert.equal(
    await region.evaluate((element) => element.parentElement?.getAttribute("aria-hidden")),
    null,
    `${locale}: a focused closed toast must not be aria-hidden`,
  );

  // The hook retains dismissed toasts, while Radix removes the closed item
  // after its exit animation. The viewport may hide only after focus leaves.
  await focusOutsideViewport();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[role="region"][aria-label*="(F8)"]')
        ?.parentElement?.getAttribute("aria-hidden") === "true",
  );
  await page.waitForFunction(
    () =>
      document.querySelector('[role="region"][aria-label*="(F8)"] [data-state]') ===
      null,
  );
  assert.equal(await region.locator('[data-state]').count(), 0);
  await page.keyboard.press("F8");
  assert.equal(
    await region.evaluate((element) => element.contains(document.activeElement)),
    false,
    `${locale}: F8 remains inert while the retained toast is closed`,
  );

  await page.evaluate(() => {
    window.__toastA11yControl.update({
      open: true,
      title: document.documentElement.lang === "hu" ? "Újranyitott értesítés" : "Reopened notification",
      description: "Toast reopened",
    });
  });
  await region.locator('[data-state="open"]').waitFor({ state: "attached" });
  assert.equal(
    await region.evaluate((element) => element.closest('[aria-hidden="true"]') === null),
    true,
    `${locale}: reopening a retained toast restores the viewport`,
  );

  await page.locator("[data-toast-a11y-focus-target]").evaluate((element) => element.remove());
  console.log(`${locale}: empty/open/closed-retained/reopen/F8/Escape/live-announcer passed.`);
}

try {
  const locales = requestedLocale === "all" ? ["hu", "en"] : [requestedLocale];
  for (const locale of locales) await runLocale(locale);
  console.log(
    `Toast accessibility regression passed for ${locales.map((locale) => locale.toUpperCase()).join(" and ")}.`,
  );
  console.log("This verifies the DOM and accessibility tree, not synthesized screen-reader speech.");
} finally {
  await browser.close();
}