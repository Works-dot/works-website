import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { articleDates, isoArticleDate } from "../src/lib/article-dates.js";
let vite, seo;
before(async () => {
  vite = await createServer({ root: fileURLToPath(new URL("..", import.meta.url)),
    server: { middlewareMode: true, hmr: false }, appType:"custom", optimizeDeps:{noDiscovery:true} });
  seo = await vite.ssrLoadModule("/src/seo-data.ts");
});
after(async()=>{ await vite?.close(); });
test("ISO dates use explicit timezone; missing updatedAt never fabricates freshness",()=>{
  assert.equal(isoArticleDate("2026-10-30T12:30:00+02:00"),"2026-10-30T10:30:00.000Z");
  assert.equal(isoArticleDate("2020-01-02"),"2020-01-02T00:00:00.000Z");
  for(const v of [null,"","bad","2026-10-30T12:30:00"])assert.equal(isoArticleDate(v),undefined);
  assert.equal(articleDates({date:"2020-01-02"}).modifiedTime,undefined);
});
test("republish changes only modified date; HTML and JSON-LD agree in HU and EN",()=>{
  const first="2020-01-02T00:00:00.000Z", updated="2026-10-30T10:30:00.123Z";
  const post={originalPublishedAt:first,date:"2025-01-01",publishedAt:updated,updatedAt:updated};
  for(const locale of ["hu","en"]){
    const meta={title:"Article | Works.",description:"Article",locale,path:`/${locale}/article`,type:"article",article:articleDates(post)};
    const markup=seo.buildMetaTags(meta);
    assert.ok(markup.includes(`property="article:published_time" content="${first}"`));
    assert.ok(markup.includes(`property="article:modified_time" content="${updated}"`));
    const posting=seo.buildJsonLd(meta).map(s=>JSON.parse(s.match(/>([\s\S]*)<\/script>/)[1])).find(n=>n["@type"]==="BlogPosting");
    assert.equal(posting.datePublished,first); assert.equal(posting.dateModified,updated);
    const newer={...post,updatedAt:"2026-10-31T00:00:00.000Z"};
    const live=seo.buildJsonLd(meta,undefined,{post:newer}).map(s=>JSON.parse(s.match(/>([\s\S]*)<\/script>/)[1])).find(n=>n["@type"]==="BlogPosting");
    assert.equal(live.dateModified,newer.updatedAt);assert.equal(live.datePublished,first);
  }
  assert.ok(!seo.buildMetaTags({title:"About",description:"About",path:"/rolunk"}).includes("article:modified_time"));
});
