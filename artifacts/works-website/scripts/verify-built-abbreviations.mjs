import assert from "node:assert/strict";
import { render, getLocaleFallback } from "../dist/server/entry-server.js";

// In-memory fixtures only: no CMS writes, snapshots, or public test pages.
for (const locale of ["hu", "en"]) {
  const posts = getLocaleFallback("blogPosts", locale);
  assert.ok(posts?.length, `Missing ${locale} test source`);
  const slug = `abbr-ssr-verification-${locale}`;
  const fixture = {
    ...posts[0],
    slug,
    title: "Abbreviation verification",
    content: [{ type: "text", content: 'Előtte **szöveg**. <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> és <abbr title="Saját feloldás">UX</abbr>.' }],
  };
  posts.push(fixture);
  try {
    const { html } = render(`${locale === "en" ? "/en" : ""}/blog/${slug}`);
    assert.match(html, /<abbr title="Web Content Accessibility Guidelines">WCAG<\/abbr>/);
    assert.match(html, /<abbr title="Saját feloldás">UX<\/abbr>/);
    assert.match(html, /<strong>szöveg<\/strong>/);
    console.log(`${locale}: built article HTML contains exact abbr/title and preserved formatting`);
  } finally {
    posts.pop();
  }
}
