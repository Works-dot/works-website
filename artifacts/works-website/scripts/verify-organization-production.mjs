import assert from "node:assert/strict";
import sharp from "sharp";
import { chromium } from "playwright";

const origin = "https://www.worksdot.hu";
const expected = {
  legalName: "Works. Hungary Kft.",
  email: "info@worksdot.hu",
  telephone: "+36 30 930 4901",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Ménesi út 18.",
    postalCode: "1118",
    addressLocality: "Budapest",
    addressCountry: "HU",
  },
  logo: `${origin}/organization-logo.png`,
};
const pattern = new RegExp('<script[^>]*type="application/ld\\+json"[^>]*>([\\s\\S]*?)</script>', "g");
function identity(records) {
  const organizations = records.filter((item) => item["@type"] === "Organization");
  assert.equal(organizations.length, 1, "Exactly one Organization required");
  const data = organizations[0];
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(data[key], value, key);
  assert.ok(data.sameAs?.length, "CMS social profiles must remain present");
  const { description, ...stable } = data;
  return stable;
}
let baseline;
for (const path of ["/", "/en", "/kapcsolat", "/en/contact", "/impresszum"]) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const current = identity([...html.matchAll(pattern)].map((match) => JSON.parse(match[1])));
  if (baseline) assert.deepEqual(current, baseline, path);
  baseline = current;
  console.log(`Static Organization OK: ${path}`);
}
const logo = await fetch(expected.logo);
assert.equal(logo.status, 200);
assert.match(logo.headers.get("content-type"), /^image\/png/);
const metadata = await sharp(Buffer.from(await logo.arrayBuffer())).metadata();
assert.ok(metadata.width >= 112 && metadata.height >= 112);
console.log(`Logo OK: ${metadata.width}×${metadata.height} PNG`);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(origin, { waitUntil: "networkidle" });
  // Real internal links exercise the router and client-owned head updates.
  for (const path of ["/en", "/en/contact"]) {
    await page.locator(`a[href="${path}"]`).first().click();
    await page.waitForURL(`${origin}${path}`);
    await page.waitForFunction(() => document.head.querySelector("script[data-client-json-ld]"));
    const records = await page.locator('head script[type="application/ld+json"]').evaluateAll(
      (elements) => elements.map((element) => JSON.parse(element.textContent)),
    );
    assert.deepEqual(identity(records), baseline, `Client navigation: ${path}`);
    console.log(`Client Organization OK: ${path}`);
  }
} finally {
  await browser.close();
}