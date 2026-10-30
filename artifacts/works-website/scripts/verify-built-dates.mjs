// Run after the production-mode client + SSR builds and prerender.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { displayDate } from "../src/lib/display-date.js";
const cache = JSON.parse(await fs.readFile(new URL("../src/data/strapi-cache.json", import.meta.url), "utf8"));
const dist = new URL("../dist/public/", import.meta.url);
let articles = 0, cards = 0;
function checkTimes(html, locale) {
  const times = [...html.matchAll(/<time\b[^>]*datetime="([^"]+)"[^>]*>([^<]*)<\/time>/gi)];
  assert.ok(times.length, `No time element for ${locale}`);
  for (const [, date, text] of times) assert.equal(text, displayDate(date, locale)?.text);
  assert.ok(!html.includes("Invalid Date"));
  return times;
}
for (const locale of ["hu", "en"]) {
  const prefix = locale === "en" ? "en/" : "";
  for (const post of cache[locale].blogPosts) {
    const html = await fs.readFile(new URL(`${prefix}blog/${post.slug}/index.html`, dist), "utf8");
    const times = checkTimes(html, locale);
    assert.equal(times[0][1], post.date);
    articles++;
  }
  for (const page of ["index.html", "blog/index.html"]) {
    const html = await fs.readFile(new URL(`${prefix}${page}`, dist), "utf8");
    cards += checkTimes(html, locale).length;
  }
  const example = cache[locale].blogPosts[0];
  console.log(`${locale}: /${prefix}blog/${example.slug} → ${JSON.stringify(displayDate(example.date, locale))}`);
}
console.log(`PASS: ${articles} article pages and ${cards} homepage/list card dates in prerendered HU/EN HTML.`);
