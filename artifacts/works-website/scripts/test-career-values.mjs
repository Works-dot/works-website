import assert from "node:assert/strict";
import { chromium } from "playwright";
const DESKTOP = 1024;
const WIDTHS = [320, 390, 1440, 1920];
const FIXTURE_WIDTHS = [320, 1440];
const HEADING_WIDTHS = [390, 1440];
const HEADINGS_ONLY = process.argv.includes("--headings-only");
const NATIVE_ONLY = process.argv.includes("--native-only");
const VALUE_HEADING_SELECTOR = '[data-testid="career-value-text"] h3:not([aria-hidden="true"])';

const NATIVE_VALUES = {
  hu: [
    {
      title: "Együttműködés",
      description: "Hiszünk abban, hogy az együttműködés képes összekapcsolni tudást, tapasztalatot és emberi energiákat.",
      asset: "egyuttmukodes-new_1789551061820",
    },
    {
      title: "Alkalmazkodás",
      description: "Hiszünk abban, hogy a tartós érték nem a változatlanságból, hanem a megújulás képességéből születik.",
      asset: "alkalmazkodas-new_1789551061821",
    },
    {
      title: "Empátia",
      description: "Hiszünk abban, hogy a megértés képes hidat építeni emberek, márkák és technológiák között.",
      asset: "empatia-new_1789551061821",
    },
  ],
  en: [
    {
      title: "Collaboration",
      description: "We believe that collaboration can bring together knowledge, experience and human energy.",
      asset: "egyuttmukodes-new_1789551061820",
    },
    {
      title: "Adaptability",
      description: "We believe that lasting value comes not from standing still, but from the ability to adapt and renew.",
      asset: "alkalmazkodas-new_1789551061821",
    },
    {
      title: "Empathy",
      description: "We believe that understanding can build bridges between people, brands and technology.",
      asset: "empatia-new_1789551061821",
    },
  ],
};
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

// Keep this in sync with ValueHeadingText without asserting against its
// aria-hidden decorative period. The source removes all trailing periods and
// whitespace before TermText receives the value.
function normalizeValueHeading(title) {
  const text = String(title ?? "").trimEnd().replace(/[.\s]+$/, "");
  return text.trim() ? text : "";
}

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

function recordSectionHeading(body) {
  const root = body?.data ?? body;
  const record = root?.attributes ?? root;
  const whyUs = record?.whyUs?.data?.attributes ?? record?.whyUs?.attributes ?? record?.whyUs;
  return String(whyUs?.sectionHeading ?? "");
}

function imageUrl(url) {
  if (!url) return null;
  return new URL(url.startsWith("/strapi/") ? url : `/strapi${url}`, baseUrl).href;
}

function normalizedAssetName(url) {
  if (!url) return "";
  return decodeURIComponent(url).toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function assertNativeCmsItems(items, locale) {
  const expected = NATIVE_VALUES[locale];
  assert.equal(items.length, expected.length, `${locale}: CMS must contain exactly three career values`);
  for (let i = 0; i < expected.length; i++) {
    const actual = items[i];
    const value = expected[i];
    assert.equal(actual.title, value.title, `${locale}: CMS title/order ${i}`);
    assert.equal(actual.description, value.description, `${locale}: CMS description ${i}`);
    assert.ok(actual.image, `${locale}: CMS image ${i} is missing`);
    assert.ok(
      normalizedAssetName(actual.image).includes(normalizedAssetName(value.asset)),
      `${locale}: CMS image ${i} is not the new ${value.asset} asset (${actual.image})`,
    );
  }
}

function fixtureBody(body, items, sectionHeading) {
  const result = clone(body);
  const root = result.data ?? result;
  const record = root?.attributes ?? root;
  const oldSection = record?.whyUs?.data?.attributes ?? record?.whyUs?.attributes ?? record?.whyUs ?? {};
  record.whyUs = {
    ...oldSection,
    ...(sectionHeading === undefined ? {} : { sectionHeading }),
    items: items.map((item) => ({
      title: item.title,
      description: item.description,
      image: item.image == null ? null : { url: item.image },
    })),
  };
  return result;
}

async function waitForRows(page, expected) {
  await page.waitForFunction(({ count, titles }) => {
    const text = (element) => { if (!element) return null; const copy = element.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"], .sr-only').forEach((node) => node.remove()); return copy.textContent.trim(); };
    const rows = [...document.querySelectorAll('[data-testid="career-value-row"]')];
    return rows.length === count && rows.every((row, i) => text(
      row.querySelector('[data-testid="career-value-text"] h3:not([aria-hidden="true"])'),
    ) === titles[i]);
  }, { count: expected.length, titles: expected.map((item) => normalizeValueHeading(item.title)) });
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
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));

  for (let i = 0; i < expected.length; i++) {
    const row = rows.nth(i);
    const value = expected[i];
    const rowBox = await row.boundingBox();
    assert.ok(rowBox, `${label}: missing row geometry ${i}`);
    assert.ok(Math.abs(rowBox.x) <= 1 && Math.abs(rowBox.width - viewport.width) <= 1,
      `${label}: row ${i} is not full viewport width (${rowBox.x}px / ${rowBox.width}px / ${viewport.width}px)`);
    const shadow = await row.evaluate((element) => {
      const boxShadow = getComputedStyle(element).boxShadow;
      const segments = [...boxShadow.matchAll(/(rgba?\([^)]*\)|#[\da-f]{3,8})\s+(-?[\d.]+)px\s+(-?[\d.]+)px/gi)];
      const hasBoundary = segments.some(([, color, x, y]) => {
        const alpha = color.match(/rgba?\([^)]*,\s*([\d.]+)\)$/i)?.[1];
        return (!alpha || Number(alpha) > 0) && Math.abs(Number(x)) <= 1 && Number(y) > 0;
      });
      return { boxShadow, hasBoundary };
    });
    assert.ok(shadow.boxShadow && shadow.boxShadow !== "none" && shadow.hasBoundary,
      `${label}: row shadow is not a subtle horizontal boundary shadow ${i}`);
    const title = row.locator(VALUE_HEADING_SELECTOR).first();
    const description = row.locator('[data-testid="career-value-text"] p').first();
    const visibleText = async (locator) => locator.evaluate((element) => {
      const copy = element.cloneNode(true);
      copy.querySelectorAll(".sr-only").forEach((node) => node.remove());
      return copy.textContent.trim();
    });
    const visibleHeadingText = async (locator) => locator.evaluate((element) => {
      const copy = element.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"], .sr-only').forEach((node) => node.remove());
      return copy.textContent;
    });
    assert.equal(await visibleHeadingText(title), normalizeValueHeading(value.title), `${label}: title ${i}`);
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
      assert.equal(textBox.x < imageBox.x, i % 2 === 0, `${label}: desktop text/image order ${i}`);
      assert.ok(Math.abs(imageBox.width - textBox.width) <= 1,
        `${label}: equal desktop columns ${i} (${imageBox.width}px / ${textBox.width}px)`);
      assert.ok(Math.abs(imageBox.width - viewport.width / 2) <= 1 &&
        Math.abs(textBox.width - viewport.width / 2) <= 1,
      `${label}: desktop columns are not 50/50 ${i}`);
    } else {
      if (!value.image) continue;
      const presentation = await row.evaluate((element) => {
        const imageRegion = element.querySelector('[data-testid="career-value-image"]');
        const image = imageRegion?.querySelector("img");
        const textRegion = element.querySelector('[data-testid="career-value-text"]');
        const rowStyle = getComputedStyle(element);
        const imageRegionStyle = imageRegion ? getComputedStyle(imageRegion) : null;
        const imageStyle = image ? getComputedStyle(image) : null;
        const textStyle = textRegion ? getComputedStyle(textRegion) : null;
        const parseColor = (color) => {
          const oklab = color?.match(/oklab\(\s*([\d.]+)[^/)]*(?:\/\s*([\d.]+))?\s*\)/i);
          if (oklab && Number(oklab[1]) >= 0.95) {
            return { r: 255, g: 255, b: 255, a: oklab[2] == null ? 1 : Number(oklab[2]) };
          }
          const match = color?.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
          if (!match) return null;
          return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] == null ? 1 : Number(match[4]) };
        };
        const luminance = ({ r, g, b }) => {
          const channel = (value) => {
            const normalized = value / 255;
            return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        const contrast = (foreground, background) => {
          const foregroundLuminance = luminance(foreground);
          const backgroundLuminance = luminance(background);
          return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
            (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
        };
        const layerNodes = [textRegion, imageRegion, element].flatMap((node) => node ? [
          node,
          ...node.querySelectorAll("*"),
        ] : []);
        const layers = layerNodes.flatMap((node) => [
          getComputedStyle(node),
          getComputedStyle(node, "::before"),
          getComputedStyle(node, "::after"),
        ]);
        const textColor = textStyle && parseColor(textStyle.color);
        const overlays = layers.map((style) => parseColor(style.backgroundColor))
          .filter((color) => color && color.r >= 245 && color.g >= 245 && color.b >= 245 && color.a > 0);
        const overlayContrasts = textColor ? overlays.map((overlay) => {
          const worstCaseBackground = {
            r: 255 * overlay.a,
            g: 255 * overlay.a,
            b: 255 * overlay.a,
          };
          return { alpha: overlay.a, ratio: contrast(textColor, worstCaseBackground) };
        }) : [];
        const textRect = textRegion?.getBoundingClientRect();
        const imageRect = imageRegion?.getBoundingClientRect();
        const rowRect = element.getBoundingClientRect();
        const overlapY = textRect && imageRect
          ? Math.min(textRect.bottom, imageRect.bottom) - Math.max(textRect.top, imageRect.top)
          : 0;
        const point = textRect && textRect.width > 0 && textRect.height > 0
          ? document.elementsFromPoint(textRect.left + textRect.width / 2, textRect.top + textRect.height / 2)
          : [];
        const textIsOnTop = textRegion && point.some((node) => node === textRegion || textRegion.contains(node));
        return {
          rowOpacity: Number(rowStyle.opacity),
          imagePosition: imageStyle?.position,
          imageRegionPosition: imageRegionStyle?.position,
          overlapY,
          textIsOnTop,
          overlayContrasts,
          rowHeight: rowRect.height,
        };
      });
      assert.ok(presentation.rowOpacity >= 0.99, `${label}: mobile row opacity fades text ${i}`);
      assert.ok(presentation.imagePosition === "absolute" || presentation.imageRegionPosition === "absolute",
        `${label}: mobile image is not absolutely positioned behind text ${i}`);
      assert.ok(presentation.overlapY > 0, `${label}: mobile image is stacked separately from text ${i}`);
      assert.equal(presentation.textIsOnTop, true, `${label}: mobile text is not above the image ${i}`);
      assert.ok(presentation.overlayContrasts.some(({ alpha, ratio }) => alpha < 1 && ratio >= 4.5),
        `${label}: mobile white overlay does not provide 4.5:1 worst-case contrast ${i}`);
    }
  }
}

function makeFixtures(body) {
  const source = recordItems(body);
  const fallbackImage = source.find((item) => item.image)?.image || "";
  const seed = source.slice(0, 4);
  while (seed.length < 4) {
    seed.push({ title: `Regression value ${seed.length + 1}`, description: "Regression fixture value.", image: fallbackImage });
  }
  const four = seed.map((item) => ({ ...item, image: item.image || fallbackImage })).slice(0, 4).reverse();
  four[0].description += " This deliberately long regression description verifies that the value text remains fully visible without clipping, truncation, or a fixed-height carousel card.";
  four[2].image = "";
  four[1].description = null;
  four[3].description = "";
  return [four, [four[0]], []];
}

function makeHeadingFixtures(body) {
  const source = recordItems(body);
  const fallbackImage = source.find((item) => item.image)?.image || "";
  return [
    {
      name: "normal",
      sectionHeading: "Céges értékeink",
      title: "Együttműködés",
    },
    {
      name: "already-period",
      sectionHeading: "Céges értékeink.",
      title: "Alkalmazkodás.",
    },
    {
      name: "trailing-whitespace",
      sectionHeading: "Céges értékeink.  \n\t",
      title: "Empátia. \n\t",
    },
    {
      // A single whitespace is intentional: it is truthy to the source
      // fallback, so ValueHeadingText itself receives the empty value.
      name: "empty",
      sectionHeading: " ",
      title: "",
    },
    {
      name: "long-multiword",
      sectionHeading: "A rendkívül hosszú, több szóból álló céges értékek szekciócíme",
      title: "Egy rendkívül hosszú, több szóból álló céges érték, amely több sorba törik",
    },
  ].map((fixture) => ({
    ...fixture,
    items: [{
      title: fixture.title,
      description: "",
      image: fallbackImage,
    }],
  }));
}

async function waitForHeadingRows(page, expected) {
  await page.waitForFunction(({ sectionHeading, titles }) => {
    const text = (element) => {
      if (!element) return null;
      const copy = element.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"], .sr-only').forEach((node) => node.remove());
      return copy.textContent.trim();
    };
    const section = document.querySelector('[data-testid="career-values"]');
    const rows = [...document.querySelectorAll('[data-testid="career-value-row"]')];
    return section
      && text(section.querySelector('h2:not([aria-hidden="true"])')) === sectionHeading
      && rows.length === titles.length
      && rows.every((row, i) => text(
        row.querySelector('[data-testid="career-value-text"] h3:not([aria-hidden="true"])'),
      ) === titles[i]);
  }, {
     sectionHeading: expected.sectionHeading.trim(),
    titles: expected.items.map((item) => normalizeValueHeading(item.title)),
  });
}

async function assertHeading(page, heading, sourceTitle, label) {
  const expectedText = normalizeValueHeading(sourceTitle);
  const details = await heading.evaluate((element) => {
    const stripDecorativeText = (copy) => {
      copy.querySelectorAll('[aria-hidden="true"], .sr-only').forEach((node) => node.remove());
      return copy.textContent || "";
    };
    const copyWithoutDecorative = element.cloneNode(true);
    const visibleCopy = element.cloneNode(true);
    visibleCopy.querySelectorAll(".sr-only").forEach((node) => node.remove());
    const visibleText = (visibleCopy.textContent || "").replace(/\u2060/g, "");
    const decorative = [...element.querySelectorAll('[aria-hidden="true"]')];
    const decoration = decorative.find((node) => node.matches("span")) || null;
    const fontProperties = [
      "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing",
    ];
    const headingStyle = getComputedStyle(element);
    const decorationStyle = decoration ? getComputedStyle(decoration) : null;
    const sourceTextNodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (
        node.nodeValue
        && node.nodeValue.length
        && !parent?.closest('[aria-hidden="true"], .sr-only')
      ) {
        sourceTextNodes.push(node);
      }
    }
    const rectForCharacter = (textNode, index) => {
      if (!textNode) return null;
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      return {
        left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
        width: rect.width, height: rect.height,
      };
    };
    const lastSourceNode = sourceTextNodes[sourceTextNodes.length - 1];
    const lastSourceText = lastSourceNode?.nodeValue || "";
    const lastCodePoint = Array.from(lastSourceText).at(-1) || "";
    const lastLetterRect = rectForCharacter(
      lastSourceNode,
      lastSourceNode ? lastSourceText.length - lastCodePoint.length : 0,
    );
    const dotTextNode = decoration
      ? [...decoration.childNodes].find((child) => child.nodeType === Node.TEXT_NODE && child.nodeValue?.includes("."))
      : null;
    const dotText = dotTextNode?.nodeValue || "";
    const dotRect = rectForCharacter(dotTextNode, dotText.lastIndexOf("."));
    const focusBefore = document.activeElement;
    decoration?.focus();
    const font = (style) => style
      ? Object.fromEntries(fontProperties.map((property) => [property, style[property]]))
      : null;
    return {
      textWithoutDecorative: stripDecorativeText(copyWithoutDecorative),
      visiblePeriods: [...visibleText].filter((character) => character === ".").length,
      decorativeCount: decorative.length,
      decorativeAriaHidden: decoration?.getAttribute("aria-hidden") ?? null,
      decorativeText: decoration?.textContent ?? null,
      decorativeClass: decoration?.className ?? null,
      decorativeColor: decorationStyle?.color ?? null,
      headingFont: font(headingStyle),
      decorativeFont: font(decorationStyle),
      decorativeTabIndex: decoration?.getAttribute("tabindex") ?? null,
      decorativeFocusStayed: document.activeElement === focusBefore,
      decorativeFocusableElement: decoration
        ? decoration.matches("a[href],button,input,select,textarea,[contenteditable=true]")
        : false,
      lastLetterRect,
      dotRect,
    };
  });
  assert.equal(details.textWithoutDecorative, expectedText, `${label}: normalized heading text`);
  assert.equal(details.decorativeCount, expectedText ? 1 : 0, `${label}: decorative period count`);
  assert.equal(details.visiblePeriods, expectedText ? 1 : 0, `${label}: exactly one visible period`);
  if (expectedText) {
    assert.equal(details.decorativeAriaHidden, "true", `${label}: period is not aria-hidden`);
    assert.equal(details.decorativeText, "\u2060.", `${label}: word-joiner period text`);
    assert.equal(details.decorativeClass, "text-works-primary", `${label}: period color class`);
    assert.equal(details.decorativeColor, "rgb(231, 51, 82)", `${label}: period color`);
    assert.equal(details.decorativeTabIndex, null, `${label}: period has tabindex`);
    assert.equal(details.decorativeFocusStayed, true, `${label}: period can receive focus`);
    assert.equal(details.decorativeFocusableElement, false, `${label}: period is focusable`);
    for (const property of Object.keys(details.headingFont)) {
      assert.equal(details.decorativeFont[property], details.headingFont[property],
        `${label}: period ${property} does not inherit heading font`);
    }
    assert.ok(details.lastLetterRect && details.dotRect, `${label}: missing final-letter/dot range geometry`);
    assert.ok(
      Math.abs(details.lastLetterRect.top - details.dotRect.top) <= 1,
      `${label}: period wrapped onto a line by itself`,
    );
    assert.ok(
      details.dotRect.left >= details.lastLetterRect.left - 1,
      `${label}: period geometry precedes the final letter`,
    );
  } else {
    assert.equal(details.decorativeCount, 0, `${label}: empty heading rendered a decorative period`);
  }
  const accessibility = await heading.ariaSnapshot();
  assert.ok(!accessibility.includes("."), `${label}: decorative period leaked into accessible heading name`);
}

async function assertHeadingMarkup(page, expected, label) {
  const section = page.getByTestId("career-values");
  await section.waitFor({ state: "visible" });
  await waitForHeadingRows(page, expected);
  const headings = section.locator(
    'h2:not([aria-hidden="true"]), [data-testid="career-value-text"] h3:not([aria-hidden="true"])',
  );
  assert.equal(await headings.count(), expected.items.length + 1, `${label}: heading count`);
  const sectionTitle = await headings.nth(0).evaluate((element) => {
    const copy = element.cloneNode(true);
    copy.querySelectorAll(".sr-only").forEach((node) => node.remove());
    return {
      text: copy.textContent,
      decorationCount: element.querySelectorAll('[aria-hidden="true"]').length,
    };
  });
  assert.equal(sectionTitle.text, expected.sectionHeading, `${label}: unchanged section heading`);
  assert.equal(sectionTitle.decorationCount, 0, `${label}: section heading has no decorative period`);
  for (let i = 0; i < expected.items.length; i++) {
    await assertHeading(page, headings.nth(i + 1), expected.items[i].title, `${label}: value ${i}`);
  }
}

async function testHeadingsOnly(context) {
  let screenshotTaken = false;
  for (const locale of ["hu", "en"]) {
    const path = locale === "hu" ? "/karrier" : "/en/careers";
    let before;
    const page = await context.newPage();
    try {
      await page.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
      before = await readApi(page, locale);
      const native = { sectionHeading: recordSectionHeading(before), items: recordItems(before) };
      for (const width of HEADING_WIDTHS) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
        await assertHeadingMarkup(page, native, `${locale} ${width}px CMS`);
        if (!screenshotTaken && locale === "hu" && width === 390) {
          await page.getByTestId("career-values").scrollIntoViewIfNeeded();
          await page.screenshot({ path: "/tmp/career-values-heading.png" });
          screenshotTaken = true;
        }
      }
    } finally {
      await page.close();
    }

    const fixturePage = await context.newPage();
    let activeFixture = null;
    await fixturePage.route("**/strapi/api/career-page*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "GET" && url.pathname === "/strapi/api/career-page" && activeFixture) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(activeFixture),
        });
      }
      return route.continue();
    });
    try {
      for (const fixture of makeHeadingFixtures(before)) {
        activeFixture = fixtureBody(before, fixture.items, fixture.sectionHeading);
        const expected = { sectionHeading: fixture.sectionHeading, items: fixture.items };
        for (const width of HEADING_WIDTHS) {
          await fixturePage.setViewportSize({ width, height: 1000 });
          const served = fixturePage.waitForResponse(
            (response) => new URL(response.url()).pathname === "/strapi/api/career-page",
          );
          await fixturePage.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
          await served;
          await assertHeadingMarkup(
            fixturePage,
            expected,
            `${locale} ${width}px heading fixture ${fixture.name}`,
          );
        }
      }
    } finally {
      await fixturePage.unroute("**/strapi/api/career-page*");
      await fixturePage.close();
    }
  }
}

async function testLocale(context, locale) {
  const path = locale === "hu" ? "/karrier" : "/en/careers";
  const page = await context.newPage();
  await page.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
  const before = await readApi(page, locale);
  const expected = recordItems(before);
  assertNativeCmsItems(expected, locale);
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(pageUrl(path), { waitUntil: "domcontentloaded" });
    await assertValues(page, expected, width, `${locale} ${width}px CMS`);
    if (NATIVE_ONLY) {
      await assertHeadingMarkup(page, {
        sectionHeading: recordSectionHeading(before),
        items: expected,
      }, `${locale} ${width}px published headings`);
    }
  }

  if (NATIVE_ONLY) {
    assert.deepEqual(await readApi(page, locale), before, `${locale}: CMS changed during read-only checks`);
    await page.close();
    return;
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
    for (const width of FIXTURE_WIDTHS) {
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
    if (HEADINGS_ONLY) {
      await testHeadingsOnly(context);
      console.log(`✓ Career value heading period regression passed (${baseUrl})`);
    } else {
      for (const locale of ["hu", "en"]) await testLocale(context, locale);
      console.log(`✓ Career values regression passed (${baseUrl})`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});