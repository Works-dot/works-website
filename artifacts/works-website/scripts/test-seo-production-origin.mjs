import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/public/", import.meta.url));
const origin = "https://www.worksdot.hu";
const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.ok(locs.length > 0, "empty sitemap");
const checkUrl = (value) => assert.equal(new URL(value.replaceAll("&amp;", "&")).origin, origin, value);
for (const value of locs) checkUrl(value);
for (const match of sitemap.matchAll(/href="([^"]+)"/g)) checkUrl(match[1]);
let canonicalPages = 0;
for await (const entry of await fs.readdir(root, { recursive: true })) {
  if (!entry.endsWith(".html")) continue;
  const html = await fs.readFile(path.join(root, entry), "utf8");
  const tags = html.match(/<(?:meta|link)\b[^>]*>/g) || [];
  const canonical = tags.filter((tag) => /rel="canonical"/.test(tag));
  assert.ok(canonical.length <= 1, entry);
  if (canonical.length) canonicalPages++;
  for (const tag of tags.filter((tag) => /rel="canonical"|hreflang=|property="og:url"/.test(tag))) {
    checkUrl(tag.match(/(?:href|content)="([^"]+)"/)[1]);
  }
  for (const script of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
    assert.ok(!script[1].includes("workspaceworks-website-production.up.railway.app"), entry);
    JSON.parse(script[1]);
  }
}
assert.ok(canonicalPages >= locs.length, "missing generated canonical pages");
assert.match(await fs.readFile(path.join(root, "robots.txt"), "utf8"), /Sitemap: https:\/\/www\.worksdot\.hu\/sitemap\.xml/);
console.log(`PASS production origin: ${locs.length} sitemap URLs, ${canonicalPages} canonical HTML pages, alternates, OG, JSON-LD and robots`);