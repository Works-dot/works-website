import assert from "node:assert/strict";
import fs from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/public/", root);
const cache = JSON.parse(fs.readFileSync(new URL("src/data/strapi-cache.json", root)));
const { getPageMeta } = await import(new URL("dist/server/entry-server.js", root));
for (const [kind, route] of [["privacy", "adatkezeles"], ["cookie", "sutik"], ["imprint", "impresszum"]]) {
  const html = fs.readFileSync(new URL(`${route}/index.html`, dist), "utf8");
  const body = cache.hu.legalDocuments[`${kind}Body`];
  const expected = renderToStaticMarkup(React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm], skipHtml: true,
    components: { h1: ({ children }) => React.createElement("h2", null, children) },
  }, body));
  assert.ok(body.length > 500);
  assert.ok(html.replace(/<!-- -->/g, "").includes(expected), `${route}: complete published CMS Markdown is rendered`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="https://www.worksdot.hu/${route}"`));
  assert.doesNotMatch(html, /hreflang="en"/);
  assert.ok(html.includes('lang="hu"'));
}
const sitemap = fs.readFileSync(new URL("sitemap.xml", dist), "utf8");
for (const route of ["privacy", "cookies", "imprint"]) {
  assert.ok(!fs.existsSync(new URL(`en/${route}/index.html`, dist)));
  assert.ok(!sitemap.includes(`/en/${route}`));
  assert.equal(getPageMeta(`/en/${route}`).path, undefined);
}
for (const kind of ["privacy", "cookie", "imprint"]) {
  assert.equal(cache.en.legalDocuments[`${kind}Body`], "");
}
const enContact = fs.readFileSync(new URL("en/contact/index.html", dist), "utf8");
assert.match(enContact, /href="\/adatkezeles"/);
assert.match(enContact, /\(Hungarian\)/);
const cookieHtml = fs.readFileSync(new URL("sutik/index.html", dist), "utf8");
assert.match(cookieHtml, /button-open-cookie-settings/);
assert.match(cookieHtml, /_ga_&lt;azonosító&gt;/);
// Default Markdown URL sanitizer must reject script links and raw HTML.
const unsafe = renderToStaticMarkup(React.createElement(ReactMarkdown, { skipHtml: true },
  "[bad](javascript:alert%281%29)\n<script>alert(1)</script>"));
assert.doesNotMatch(unsafe, /href="javascript:|<script>/);
console.log("PASS complete HU CMS HTML, safe Markdown, consent, EN withholding, canonical and sitemap");