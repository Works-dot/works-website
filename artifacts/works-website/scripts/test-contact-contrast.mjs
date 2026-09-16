import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.argv[2];
assert.ok(baseUrl && /^https?:\/\//.test(baseUrl), "Pass the running preview URL");

const minimumRatio = 4.5;
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const locales = [
  { name: "HU", path: "/kapcsolat", htmlLang: "hu" },
  { name: "EN", path: "/en/contact", htmlLang: "en" },
];
// Tailwind's color-mix/OKLab serialization emits these exact computed CSS
// colors in Chromium; compare those values instead of composited contrast.
const worksDarkCss = "oklab(0.298536 0.065602 -0.0601458 /";
const worksPrimaryCss = "oklab(0.611282 0.203551 0.0639406 /";
const restoredFieldBorders = {
  default: {
    cssColor: `${worksDarkCss} 0.1)`,
    width: "1px",
    style: "solid",
  },
  focus: {
    cssColor: "rgb(231, 51, 82)",
    width: "1px",
    style: "solid",
    ring: { cssColor: `${worksPrimaryCss} 0.3)`, spread: 2 },
  },
};
const restoredUploadBorders = {
  default: {
    cssColor: `${worksDarkCss} 0.2)`,
    width: "1px",
    style: "dashed",
  },
  hover: {
    cssColor: `${worksPrimaryCss} 0.5)`,
    width: "1px",
    style: "dashed",
  },
  selected: {
    cssColor: `${worksPrimaryCss} 0.4)`,
    width: "1px",
    style: "solid",
  },
};

/*
 * Keep color parsing in the browser. Chromium's canvas parser handles the
 * modern computed-color forms emitted by Tailwind, including color(srgb),
 * oklab, and color-mix. A one-pixel canvas also gives us the resolved color
 * when getComputedStyle returns a color-space function rather than rgb().
 */
function measureElement(element, request) {
  const white = { r: 1, g: 1, b: 1, a: 1 };

  function resolveColor(value) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not create a 1px canvas for color parsing");
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value || "transparent";
    context.fillRect(0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    return {
      r: pixel[0] / 255,
      g: pixel[1] / 255,
      b: pixel[2] / 255,
      a: pixel[3] / 255,
    };
  }

  function withOpacity(color, opacity) {
    return { r: color.r, g: color.g, b: color.b, a: color.a * opacity };
  }

  function composite(foreground, background) {
    const alpha = foreground.a + background.a * (1 - foreground.a);
    if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
      g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
      b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
      a: alpha,
    };
  }

  function groupOnPage(color, opacity) {
    return composite(withOpacity(color, opacity), white);
  }

  function luminance(channel) {
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  }

  function contrast(foreground, background) {
    const foregroundLuminance =
      0.2126 * luminance(foreground.r) +
      0.7152 * luminance(foreground.g) +
      0.0722 * luminance(foreground.b);
    const backgroundLuminance =
      0.2126 * luminance(background.r) +
      0.7152 * luminance(background.g) +
      0.0722 * luminance(background.b);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function ancestors(target) {
    const result = [];
    for (let current = target; current; current = current.parentElement) {
      result.unshift(current);
    }
    return result;
  }

  function opacityOf(style) {
    const opacity = Number.parseFloat(style.opacity);
    return Number.isFinite(opacity) ? opacity : 1;
  }

  function backgroundSurface(nodes) {
    let surface = white;
    for (const node of nodes) {
      const background = resolveColor(getComputedStyle(node).backgroundColor);
      surface = composite(background, surface);
    }
    return surface;
  }

  function shadowLayers(shadow) {
    if (!shadow || shadow === "none") return [];
    const layers = [];
    let start = 0;
    let depth = 0;
    for (let index = 0; index < shadow.length; index += 1) {
      const character = shadow[index];
      if (character === "(") depth += 1;
      if (character === ")") depth -= 1;
      if (character === "," && depth === 0) {
        layers.push(shadow.slice(start, index).trim());
        start = index + 1;
      }
    }
    layers.push(shadow.slice(start).trim());
    const colorPattern =
      /(?:rgba?\([^)]*\)|hsla?\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i;
    return layers.map((layer) => {
      const colorMatch = layer.match(colorPattern);
      const color = colorMatch ? resolveColor(colorMatch[0]) : resolveColor("transparent");
      const lengths = (layer.match(/-?(?:\d*\.)?\d+px/g) || []).map((value) => Number.parseFloat(value));
      return { color, cssColor: colorMatch?.[0] || "transparent", lengths };
    });
  }

  const path = ancestors(element);
  const outerPath = path.slice(0, -1);
  const style = getComputedStyle(element);
  const outerSurface = backgroundSurface(outerPath);
  const targetBackground = resolveColor(style.backgroundColor);
  const targetSurface = composite(targetBackground, outerSurface);
  const ancestorOpacity = outerPath.reduce(
    (product, node) => product * opacityOf(getComputedStyle(node)),
    1,
  );
  const targetOpacity = opacityOf(style);
  const outsideScreen = groupOnPage(outerSurface, ancestorOpacity);
  const insideScreen = groupOnPage(targetSurface, ancestorOpacity * targetOpacity);

  if (request.kind === "text") {
    const textStyle = request.pseudo
      ? getComputedStyle(element, request.pseudo)
      : style;
    const textColor = resolveColor(textStyle.color);
    const pseudoOpacity = request.pseudo ? opacityOf(textStyle) : 1;
    const textOverSurface = composite(withOpacity(textColor, pseudoOpacity), targetSurface);
    const foreground = groupOnPage(textOverSurface, ancestorOpacity * targetOpacity);
    const background = insideScreen;
    return {
      kind: "text",
      ratio: contrast(foreground, background),
      foreground,
      background,
      cssForeground: textStyle.color,
      cssBackground: style.backgroundColor,
      pseudoOpacity,
    };
  }

  const borderColor = resolveColor(style.borderTopColor);
  const borderOverSurface = composite(borderColor, targetSurface);
  const borderScreen = groupOnPage(borderOverSurface, ancestorOpacity * targetOpacity);
  const rings = shadowLayers(style.boxShadow)
    .filter(({ color }) => color.a > 0.001)
    .map(({ color, cssColor, lengths }) => {
      const ringOverOuter = composite(color, outerSurface);
      const ringScreen = groupOnPage(ringOverOuter, ancestorOpacity * targetOpacity);
      return {
        ratio: contrast(ringScreen, outsideScreen),
        foreground: ringScreen,
        background: outsideScreen,
        cssColor: color,
        cssColorText: cssColor,
        lengths,
      };
    });

  return {
    kind: "border",
    borderInsideRatio: contrast(borderScreen, insideScreen),
    borderOutsideRatio: contrast(borderScreen, outsideScreen),
    borderForeground: borderScreen,
    borderColor,
    insideBackground: insideScreen,
    outsideBackground: outsideScreen,
    ringRatios: rings,
    cssBorder: style.borderTopColor,
    cssBackground: style.backgroundColor,
    borderWidth: style.borderTopWidth,
    borderStyle: style.borderTopStyle,
    cssBoxShadow: style.boxShadow,
  };
}

async function waitForSettled(page) {
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(80);
  await page.evaluate(async () => {
    const deadline = performance.now() + 2500;
    while (performance.now() < deadline) {
      const running = document
        .getAnimations({ subtree: true })
        .filter((animation) => {
          if (animation.playState !== "running") return false;
          const duration = animation.effect?.getComputedTiming?.().duration;
          return duration !== Infinity;
        });
      if (running.length === 0) break;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  });
  await page.waitForTimeout(80);
}

function colorLabel(color) {
  const channel = (value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

function ratioLabel(measurement, ratioKey = "ratio") {
  const ratio = measurement[ratioKey];
  return `${ratio.toFixed(2)}:1 ${colorLabel(measurement.foreground)}/${colorLabel(measurement.background)}`;
}

function assertTextRatio(measurement, label, report) {
  assert.ok(
    Number.isFinite(measurement.ratio) && measurement.ratio >= minimumRatio,
    `${label}: expected at least ${minimumRatio}:1, measured ${ratioLabel(measurement)}`,
  );
  report.push(`${label}=${ratioLabel(measurement)}`);
}

function normalizeCssColor(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function assertExactCssColor(actual, expected, label) {
  assert.equal(
    normalizeCssColor(actual),
    normalizeCssColor(expected),
    `${label}: expected exact computed color ${expected}, measured ${actual}`,
  );
}

function assertRestoredBorder(measurement, label, report, expected) {
  assertExactCssColor(measurement.cssBorder, expected.cssColor, `${label} border color`);
  assert.equal(measurement.borderWidth, expected.width, `${label}: expected ${expected.width} border width`);
  assert.equal(measurement.borderStyle, expected.style, `${label}: expected ${expected.style} border style`);

  if (expected.ring) {
    assert.equal(measurement.ringRatios.length, 1, `${label}: expected exactly one visible focus ring`);
    const [ring] = measurement.ringRatios;
    assertExactCssColor(ring.cssColorText, expected.ring.cssColor, `${label} focus ring color`);
    assert.deepEqual(
      ring.lengths,
      [0, 0, 0, expected.ring.spread],
      `${label}: expected a ${expected.ring.spread}px zero-offset focus ring`,
    );
  } else {
    assert.equal(measurement.ringRatios.length, 0, `${label}: unexpected visible focus ring`);
  }

  const ring = measurement.ringRatios.length
    ? ` ring=${measurement.ringRatios[0].cssColorText} ${measurement.ringRatios[0].lengths.join("px ")}px`
    : "";
  report.push(
    `${label}=actual border=${measurement.cssBorder} width=${measurement.borderWidth} style=${measurement.borderStyle}${ring}`,
  );
}

async function textCheck(page, locator, label, report, pseudo) {
  await locator.scrollIntoViewIfNeeded();
  await waitForSettled(page);
  const measurement = await locator.evaluate(measureElement, {
    kind: "text",
    pseudo,
  });
  assertTextRatio(measurement, label, report);
  return measurement;
}

async function borderCheck(page, locator, label, report, expected) {
  await locator.scrollIntoViewIfNeeded();
  await waitForSettled(page);
  const measurement = await locator.evaluate(measureElement, { kind: "border" });
  assertRestoredBorder(measurement, label, report, expected);
  return measurement;
}

async function clearFocus(page) {
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(1, 1);
}

async function invalidField(locator) {
  await locator.evaluate((element) => {
    if ("value" in element) element.value = "";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function checkField(page, locator, label, setValid, report, expected = restoredFieldBorders) {
  await setValid();
  await waitForSettled(page);
  await clearFocus(page);
  await waitForSettled(page);
  await borderCheck(page, locator, `${label}/default`, report, expected.default);

  await locator.hover();
  await waitForSettled(page);
  await borderCheck(page, locator, `${label}/hover`, report, expected.default);

  await locator.focus();
  await waitForSettled(page);
  await borderCheck(page, locator, `${label}/focus`, report, expected.focus);

  await clearFocus(page);
  await invalidField(locator);
  await waitForSettled(page);
  await borderCheck(page, locator, `${label}/invalid`, report, expected.default);
}

async function checkSubjectControl(page, subject, defaultSubject, report) {
  const wrapper = subject.locator("xpath=..");
  const label = page.locator('label[for="subject"]');
  const caret = wrapper.locator("svg");
  const form = subject.locator("xpath=ancestor::form[1]");

  assert.equal(await wrapper.count(), 1, "subject: relative wrapper is missing");
  assert.match(
    await wrapper.getAttribute("class"),
    /(?:^|\s)relative(?:\s|$)/,
    "subject: wrapper must be relative",
  );
  assert.equal(
    await wrapper.evaluate((element) => getComputedStyle(element).position),
    "relative",
    "subject: wrapper is not positioned relative",
  );
  assert.equal(await caret.count(), 1, "subject: expected exactly one decorative caret");
  assert.match(
    await caret.getAttribute("class"),
    /(?:^|\s)pointer-events-none(?:\s|$)/,
    "subject: caret must not receive pointer events",
  );
  assert.equal(await caret.getAttribute("aria-hidden"), "true", "subject: caret must be aria-hidden");
  assert.equal(await caret.getAttribute("focusable"), "false", "subject: caret must not be focusable");
  assert.equal(
    await caret.evaluate((element) => getComputedStyle(element).pointerEvents),
    "none",
    "subject: caret must have pointer-events:none",
  );

  const wrapperBox = await wrapper.boundingBox();
  const caretBox = await caret.boundingBox();
  assert.ok(wrapperBox && caretBox, "subject: could not measure caret inset");
  const rightInset = wrapperBox.x + wrapperBox.width - (caretBox.x + caretBox.width);
  assert.ok(
    Math.abs(rightInset - 20) <= 0.5,
    `subject: expected a 20px right caret inset, measured ${rightInset.toFixed(2)}px`,
  );

  const selectStyle = await subject.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      appearance: style.appearance,
      webkitAppearance: style.webkitAppearance,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
    };
  });
  assert.equal(selectStyle.appearance, "none", "subject: native appearance must be none");
  assert.equal(selectStyle.webkitAppearance, "none", "subject: WebKit native appearance must be none");
  assert.equal(selectStyle.paddingLeft, "20px", "subject: expected 20px left padding");
  assert.equal(selectStyle.paddingRight, "48px", "subject: expected 48px right padding");

  assert.equal(await label.count(), 1, "subject: label is missing");
  assert.equal(await label.getAttribute("for"), "subject", "subject: label must target #subject");
  assert.equal(
    await subject.evaluate(
      (element) => element.required && element.labels?.length === 1 && element.labels[0]?.htmlFor === "subject",
    ),
    true,
    "subject: required native control is not associated with its label",
  );
  assert.equal(await form.count(), 1, "subject: form ancestor is missing");

  await form.evaluate((element) => {
    element.dataset.contactTestSubmitCount = "0";
    element.addEventListener(
      "submit",
      () => {
        element.dataset.contactTestSubmitCount = String(
          Number(element.dataset.contactTestSubmitCount || "0") + 1,
        );
      },
      true,
    );
  });
  await subject.focus();
  assert.equal(
    await subject.evaluate((element) => document.activeElement === element),
    true,
    "subject: native select did not receive focus",
  );
  await subject.press("ArrowDown");
  await waitForSettled(page);
  assert.equal(await subject.inputValue(), defaultSubject, "subject: ArrowDown did not select the first option");
  assert.equal(
    await subject.evaluate((element) => document.activeElement === element),
    true,
    "subject: ArrowDown navigation lost native select focus",
  );
  assert.equal(
    await form.getAttribute("data-contact-test-submit-count"),
    "0",
    "subject: ArrowDown navigation submitted the form",
  );
  await subject.selectOption(defaultSubject);
  await clearFocus(page);

  report.push(
    `appearance=${selectStyle.appearance} padding-left=${selectStyle.paddingLeft} padding-right=${selectStyle.paddingRight} caret-right-inset=${rightInset.toFixed(2)}px`,
  );
}

async function runLocaleViewport(page, locale, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(new URL(locale.path, baseUrl).href, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((expected) => document.documentElement.lang === expected, locale.htmlLang);
  const name = page.locator("#name");
  const email = page.locator("#email");
  const subject = page.locator("#subject");
  const message = page.locator("#message");
  await subject.waitFor({ state: "visible" });
  await waitForSettled(page);

  const placeholders = [];
  for (const [locator, label] of [
    [name, "name"],
    [email, "email"],
    [message, "message"],
  ]) {
    await textCheck(page, locator, `${label} placeholder`, placeholders, "::placeholder");
  }

  const defaultSubject = await subject.locator("option").evaluateAll((options) => {
    const option = options.find((candidate) => candidate.value);
    return option?.value || null;
  });
  assert.ok(defaultSubject, `${locale.name}/${viewport.name}: contact subject has no selectable option`);

  const subjectControl = [];
  await checkSubjectControl(page, subject, defaultSubject, subjectControl);

  const borders = [];
  await checkField(page, name, "name border", () => name.fill("Contrast regression"), borders);
  await checkField(page, email, "email border", () => email.fill("contrast@example.test"), borders);
  await checkField(page, message, "message border", () => message.fill("Contrast regression message"), borders);
  await checkField(page, subject, "subject border", () => subject.selectOption(defaultSubject), borders);

  const text = [];
  await textCheck(page, page.locator('label[for="subject"]'), "subject label", text);
  const hoursHeading = page
    .locator("h3")
    .filter({ hasText: /Nyitvatartás|Opening hours/ })
    .first();
  await hoursHeading.waitFor({ state: "visible" });
  await textCheck(page, hoursHeading, "hours heading", text);
  const hoursParagraphs = hoursHeading.locator("xpath=..").locator("p");
  const hoursCount = await hoursParagraphs.count();
  assert.ok(hoursCount > 0, `${locale.name}/${viewport.name}: opening-hours text is missing`);
  for (let index = 0; index < hoursCount; index += 1) {
    await textCheck(page, hoursParagraphs.nth(index), `hours text ${index + 1}`, text);
  }

  const cvOption = await subject.locator("option").evaluateAll((options) => {
    const career = options.find((option) => /karrier|career/i.test(`${option.value} ${option.textContent}`));
    return career?.value || null;
  });
  assert.ok(
    cvOption,
    `${locale.name}/${viewport.name}: could not find the real Karrier/Career subject option`,
  );
  await subject.selectOption(cvOption);
  await waitForSettled(page);
  const cvInput = page.locator("#cv-upload");
  await cvInput.waitFor({ state: "attached" });
  const uploadLabel = page.locator('label[for="cv-upload"]');
  await uploadLabel.waitFor({ state: "visible" });

  const cv = [];
  await clearFocus(page);
  await borderCheck(page, uploadLabel, "CV upload/default", cv, restoredUploadBorders.default);
  await uploadLabel.hover();
  await waitForSettled(page);
  await borderCheck(page, uploadLabel, "CV upload/hover", cv, restoredUploadBorders.hover);

  await cvInput.setInputFiles({
    name: "contrast-regression.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% contrast regression client-only file\n"),
  });
  await waitForSettled(page);
  const selectedFileContainer = cvInput.locator("xpath=following-sibling::*[1]");
  await selectedFileContainer.waitFor({ state: "visible" });
  assert.match(
    await selectedFileContainer.textContent(),
    /contrast-regression\.pdf/,
    `${locale.name}/${viewport.name}: uploaded file name is not shown`,
  );
  await borderCheck(page, selectedFileContainer, "CV selected file", cv, restoredUploadBorders.selected);

  console.log(`${locale.name}/${viewport.name} placeholders: ${placeholders.join("; ")}`);
  console.log(`${locale.name}/${viewport.name} subject control: ${subjectControl.join("; ")}`);
  console.log(`${locale.name}/${viewport.name} borders: ${borders.join("; ")}`);
  console.log(`${locale.name}/${viewport.name} text: ${text.join("; ")}`);
  console.log(`${locale.name}/${viewport.name} CV: ${cv.join("; ")}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.route("**/*", async (route) => {
  const method = route.request().method();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await route.abort();
    return;
  }
  await route.continue();
});

try {
  for (const viewport of viewports) {
    for (const locale of locales) {
      await runLocaleViewport(page, locale, viewport);
    }
  }
  console.log(
    "Contact text contrast and restored border-style checks passed for HU/EN desktop/mobile without submitting the form.",
  );
} finally {
  await browser.close();
}