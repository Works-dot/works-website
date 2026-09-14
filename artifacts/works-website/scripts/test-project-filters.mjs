import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

// Pin the approved colors, rather than reading tokens that could regress too.
const RED = "rgb(231, 51, 82)";
const DARK = "rgb(63, 28, 74)";
const WHITE = "rgb(255, 255, 255)";
const MUTED = "rgb(227, 219, 229)";

async function eventually(read, expected, message) {
  const deadline = Date.now() + 5_000;
  let actual;
  do {
    actual = await read();
    try {
      assert.deepEqual(actual, expected, message);
      return;
    } catch (error) {
      if (Date.now() >= deadline) throw error;
    }
    // Allow CSS transitions and Framer Motion exit animations to finish.
    await setTimeout(50);
  } while (true);
}

async function assertColors(button, border, background, color, message) {
  await eventually(
    () => button.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borders: [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor],
        background: style.backgroundColor,
        color: style.color,
      };
    }),
    { borders: [border, border, border, border], background, color },
    message,
  );
}

export async function assertProjectFilters(page, baseUrl) {
  for (const { pathname, allLabel, locale } of [
    { pathname: "/projektek", allLabel: "Összes projekt", locale: "hu" },
    { pathname: "/en/projects", allLabel: "All projects", locale: "en" },
  ]) {
    await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    const main = page.locator("main");
    const allButton = main.getByRole("button", { name: allLabel, exact: true });
    await allButton.waitFor({ state: "visible" });
    // Scope to the desktop filter row, excluding the mobile dropdown.
    const buttons = allButton.locator("..").getByRole("button");
    const labels = (await buttons.allTextContents()).map((label) => label.trim());
    assert.ok(labels.length > 2, `${pathname}: need multiple category filters`);
    assert.equal(labels[0], allLabel);

    const cards = main.locator(`a[href^="${pathname}/"]`);
    const original = await cards.evaluateAll((links) => links.map((link) => ({
      href: link.getAttribute("href"),
      tags: Array.from(link.querySelectorAll("span")).map((tag) => tag.textContent.trim()),
    })));
    assert.ok(original.length > 1, `${pathname}: need multiple project cards`);
    const allHrefs = original.map(({ href }) => href).sort();
    const selectedLabel = labels.slice(1).find((label) => {
      const count = original.filter(({ tags }) => tags.includes(label)).length;
      return count > 0 && count < original.length;
    });
    assert.ok(selectedLabel, `${pathname}: need a category that narrows the project list`);
    const expectedHrefs = original
      .filter(({ tags }) => tags.includes(selectedLabel))
      .map(({ href }) => href).sort();
    const selected = buttons.nth(labels.indexOf(selectedLabel));
    const assertCards = (expected, state) => eventually(
      () => cards.evaluateAll((links) => links
        .filter((link) => link.checkVisibility())
        .map((link) => link.getAttribute("href")).sort()),
      expected,
      `${pathname}: ${state} should show the exact expected project cards`,
    );
    const assertSelected = (button, state) =>
      assertColors(button, RED, RED, WHITE, `${pathname}: ${state} must remain red`);

    await allButton.hover();
    await assertSelected(allButton, "initial All hover");
    for (let index = 1; index < labels.length; index++) {
      await buttons.nth(index).hover();
      await assertColors(buttons.nth(index), DARK, WHITE, DARK,
        `${pathname}: inactive "${labels[index]}" hover must have a dark border`);
      await assertSelected(allButton, "All while an inactive category is hovered");
    }

    await selected.click();
    await assertCards(expectedHrefs, `selecting "${selectedLabel}"`);
    await selected.hover();
    await assertSelected(selected, "selected category hover");
    await allButton.hover();
    await assertColors(allButton, DARK, WHITE, DARK,
      `${pathname}: inactive All hover must have a dark border`);
    await assertSelected(selected, "selected category without hover");
    // A separate inactive category must not change the current selection.
    const otherIndex = labels.findIndex((label, index) => index > 0 && label !== selectedLabel);
    await buttons.nth(otherIndex).hover();
    await assertColors(buttons.nth(otherIndex), DARK, WHITE, DARK,
      `${pathname}: another category hover must have a dark border`);
    await assertSelected(selected, "selected category while another category is hovered");
    await assertCards(expectedHrefs, "hovering another category");

    await allButton.click();
    await assertCards(allHrefs, "clearing with All");
    await assertSelected(allButton, "All after clearing");
    await assertColors(selected, MUTED, WHITE, DARK,
      `${pathname}: cleared category must return to its inactive style`);

    await selected.click();
    await assertCards(expectedHrefs, "reselecting the category");
    await assertSelected(selected, "reselected category");
    await selected.click();
    await assertCards(allHrefs, "clearing by clicking the selected category again");
    await assertSelected(allButton, "All after toggling the category off");
    await assertColors(selected, DARK, WHITE, DARK,
      `${pathname}: toggled-off category hover must return to a dark border`);
    console.log(`✓ ${pathname}: project-filter hover, selection, and both clear actions passed`);
  }
}