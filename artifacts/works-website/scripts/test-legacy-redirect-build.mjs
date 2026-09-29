import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readLegacyRedirects } from "../legacy-redirects.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist/public");
const redirects = readLegacyRedirects(dist);
assert.equal(Object.keys(redirects).length, 29);
const cache = JSON.parse(fs.readFileSync(path.join(root, "src/data/strapi-cache.json")));
assert.equal(redirects["/imprint"], "https://www.worksdot.hu/impresszum");
assert.equal(redirects["/terms"], "https://www.worksdot.hu/impresszum");
for (const [source, destination] of Object.entries(redirects)) {
  const url = new URL(destination);
  assert.equal(url.origin, "https://www.worksdot.hu");
  const html = fs.readFileSync(path.join(dist, url.pathname, "index.html"), "utf8");
  assert.match(html, /<h1\b/, destination);
  assert.ok(html.includes(`rel="canonical" href="${destination}"`), destination);
  assert.ok(!html.includes("<title>Az oldal nem található"), destination);
}
const homepage = fs.readFileSync(path.join(dist, "index.html"), "utf8");
assert.ok(homepage.includes('href="/impresszum"'), "footer must link to imprint HTML");
console.log("PASS built manifest: 29 routes target generated HTML, including imprint and terms");