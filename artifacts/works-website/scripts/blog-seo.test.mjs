import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

let vite, seo, fallback;
before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
  });
  seo = await vite.ssrLoadModule("/src/seo-data.ts");
  fallback = await vite.ssrLoadModule("/src/data/fallback.ts");
});
after(async () => { await vite?.close(); });

test("two English articles have distinct article-specific prerendered titles", () => {
  const posts = fallback.getLocaleFallback("blogPosts", "en").slice(0, 2);
  assert.equal(posts.length, 2);
  const titles = posts.map((post) => {
    const meta = seo.getPageMeta(`/en/blog/${post.slug}`);
    assert.equal(meta.title, post.seo?.metaTitle?.trim() || `${post.title} | Works.`);
    assert.equal(meta.description, post.seo?.metaDescription?.trim() || post.excerpt.trim() || `${post.title} | Works.`);
    assert.notEqual(meta.title, "Works. | Digital Agency");
    assert.ok(seo.buildMetaTags(meta).includes('name="description"'));
    return meta.title;
  });
  assert.notEqual(titles[0], titles[1]);
});

test("English article SEO overrides and empty-field fallbacks stay article-specific", () => {
  const post = fallback.getLocaleFallback("blogPosts", "en")[0];
  const original = { seo: post.seo, excerpt: post.excerpt };
  const route = `/en/blog/${post.slug}`;
  try {
    post.seo = { metaTitle: " Editorial title ", metaDescription: " Editorial description " };
    assert.equal(seo.getPageMeta(route).title, "Editorial title");
    assert.equal(seo.getPageMeta(route).description, "Editorial description");
    post.seo = { metaTitle: " ", metaDescription: " " };
    assert.equal(seo.getPageMeta(route).title, `${post.title} | Works.`);
    assert.equal(seo.getPageMeta(route).description, original.excerpt.trim());
    post.excerpt = " ";
    assert.equal(seo.getPageMeta(route).description, `${post.title} | Works.`);
    post.seo = null;
    assert.equal(seo.getPageMeta(route).title, `${post.title} | Works.`);
  } finally {
    Object.assign(post, original);
  }
});
