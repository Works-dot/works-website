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
const pdf = new URL(cache.hu.legalDocuments.imprintPdfUrl, "https://www.worksdot.hu").href;
assert.equal(redirects["/imprint"], pdf);
assert.equal(redirects["/terms"], pdf);
for (const [source, destination] of Object.entries(redirects)) {
  if (source === "/imprint" || source === "/terms") continue;
  const url = new URL(destination);
  assert.equal(url.origin, "https://www.worksdot.hu");
  const html = fs.readFileSync(path.join(dist, url.pathname, "index.html"), "utf8");
  assert.match(html, /<h1\b/, destination);
  assert.ok(html.includes(`rel="canonical" href="${destination}"`), destination);
  assert.ok(!html.includes("<title>Az oldal nem található"), destination);
}
const homepage = fs.readFileSync(path.join(dist, "index.html"), "utf8");
assert.ok(homepage.includes(cache.hu.legalDocuments.imprintPdfUrl), "footer PDF differs from manifest");
console.log("PASS built manifest: 29 routes, 27 generated HTML targets, 2 legal redirects match footer/cache PDF");