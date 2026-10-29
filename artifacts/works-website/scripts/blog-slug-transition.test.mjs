import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { HU_BLOG_SLUG_PAIRS, sourceHuBlogSlug, canonicalTransitionPath } from "../src/lib/blog-slug-transition.js";
import { normalizeRequestTarget } from "../url-normalization.mjs";
import { buildLegacyRedirects } from "../legacy-redirects.mjs";

let vite, seo, fallback;
before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    server: { middlewareMode: true, hmr: false }, appType: "custom",
    optimizeDeps: { noDiscovery: true },
  });
  seo = await vite.ssrLoadModule("/src/seo-data.ts");
  fallback = await vite.ssrLoadModule("/src/data/fallback.ts");
});
after(async () => { await vite?.close(); });

test("all nine HU aliases preserve content, old canonical and language pairing during phase one", () => {
  assert.equal(Object.keys(HU_BLOG_SLUG_PAIRS).length, 9);
  assert.equal(new Set(Object.values(HU_BLOG_SLUG_PAIRS)).size, 9);
  for (const [oldSlug, alias] of Object.entries(HU_BLOG_SLUG_PAIRS)) {
    const oldPath = `/blog/${oldSlug}`, newPath = `/blog/${alias}`;
    const original = fallback.getLocaleFallback(`blogPost:${oldSlug}`, "hu");
    assert.ok(original);
    assert.equal(fallback.getLocaleFallback(`blogPost:${alias}`, "hu"), original);
    assert.deepEqual(seo.getPageMeta(newPath), seo.getPageMeta(oldPath));
    assert.equal(seo.getPageMeta(newPath).path, oldPath);
    assert.deepEqual(seo.getAlternateLinks(newPath), seo.getAlternateLinks(oldPath));
    assert.equal(fallback.getLocaleCounterpartSlug("hu", "en", "blogPost", alias),
      fallback.getLocaleCounterpartSlug("hu", "en", "blogPost", oldSlug));
    assert.equal(sourceHuBlogSlug(alias), oldSlug);
    assert.equal(canonicalTransitionPath(`/en/blog/${alias}`), `/en/blog/${alias}`);
    for (const route of [oldPath, newPath]) {
      assert.equal(normalizeRequestTarget(route, buildLegacyRedirects()), route);
    }
  }
});
