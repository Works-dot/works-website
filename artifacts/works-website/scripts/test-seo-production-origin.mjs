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
const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");
// Lock down this single wildcard group, so no more-specific user-agent group
// can silently override the public-upload exception.
assert.equal(robots.replaceAll("\r\n", "\n"),
  `User-agent: *\nAllow: /\nDisallow: /strapi/\nAllow: /strapi/uploads/\n\nSitemap: ${origin}/sitemap.xml\n`);
const rules = [...robots.matchAll(/^(Allow|Disallow): (\/[^\r\n]*)$/gm)]
  .map(([, directive, prefix]) => ({ allow: directive === "Allow", prefix }));
// These fixtures exercise literal rules only. RFC 9309: longest matching
// rule wins, with Allow preferred on equal specificity; NOT first-match.
const allowed = (pathname) => {
  const matches = rules.filter(({ prefix }) => pathname.startsWith(prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
};
for (const pathname of ["/", "/blog", "/en/blog", "/media/image.webp",
  "/strapi/uploads/photo.png", "/strapi/uploads/impresszum.pdf",
  "/strapi/uploads/nested/photo.svg"]) {
  assert.equal(allowed(pathname), true, `must allow ${pathname}`);
}
for (const pathname of ["/strapi/", "/strapi/admin", "/strapi/api/services",
  "/strapi/uploads-private/file.pdf", "/strapi/uploads"]) {
  assert.equal(allowed(pathname), false, `must disallow ${pathname}`);
}
console.log(`PASS production origin: ${locs.length} sitemap URLs, ${canonicalPages} canonical HTML pages, alternates, OG, JSON-LD and robots`);