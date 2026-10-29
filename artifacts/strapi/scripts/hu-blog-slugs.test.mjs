import test from "node:test";
import assert from "node:assert/strict";
import { HU_SLUG_MIGRATION, planHuSlugUpdates } from "../src/hu-blog-slugs.ts";
import { HU_BLOG_SLUG_PAIRS } from "../../works-website/src/lib/blog-slug-transition.js";

test("CMS mapping exactly matches the nine website redirects", () => {
  assert.deepEqual(Object.fromEntries(HU_SLUG_MIGRATION.map(([,from,to]) => [from,to])), HU_BLOG_SLUG_PAIRS);
});
test("draft and published HU versions change only slug; EN and other content untouched; idempotent", () => {
  const rows = HU_SLUG_MIGRATION.flatMap(([documentId,slug],index) => [
    { id: index*3, documentId, slug, locale:"hu", publishedAt:null, title:"Draft edit", seo:{metaTitle:"Keep draft SEO"} },
    { id: index*3+1, documentId, slug, locale:"hu", publishedAt:"2026-01-01", title:"Published title", seo:{metaTitle:"Keep live SEO"} },
    { id: index*3+2, documentId, slug, locale:"en", publishedAt:"2026-01-01", title:"English", seo:null },
  ]);
  const before = structuredClone(rows);
  const changes = planHuSlugUpdates(rows);
  assert.equal(changes.length,18);
  assert.deepEqual(rows,before);
  for (const change of changes) rows.find(row=>row.id===change.id).slug=change.to;
  assert.deepEqual(planHuSlugUpdates(rows),[]);
  for (let i=0;i<rows.length;i++) {
    assert.deepEqual({...rows[i],slug:before[i].slug},before[i]);
    if (rows[i].locale==="en") assert.deepEqual(rows[i],before[i]);
  }
});
test("editor slug drift and conflicting destination abort the entire plan", () => {
  const [documentId,slug,to]=HU_SLUG_MIGRATION[0];
  assert.throws(()=>planHuSlugUpdates([{id:1,documentId,slug:"custom-editor-slug",locale:"hu"}]),/unexpected/);
  assert.throws(()=>planHuSlugUpdates([
    {id:1,documentId,slug,locale:"hu"}, {id:2,documentId:"other",slug:to,locale:"hu"},
  ]),/another article/);
});
