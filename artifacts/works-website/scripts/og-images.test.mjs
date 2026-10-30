import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import sharp from "sharp";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { renderOg, ogFilename, loadOgSource } from "./generate-og-images.mjs";
let vite, seo, og, cache;
before(async () => {
  vite = await createServer({root:fileURLToPath(new URL("..",import.meta.url)),server:{middlewareMode:true,hmr:false},appType:"custom",optimizeDeps:{noDiscovery:true}});
  seo = await vite.ssrLoadModule("/src/seo-data.ts");
  og = await vite.ssrLoadModule("/src/lib/og-image.ts");
  cache = JSON.parse(await fs.readFile(new URL("../src/data/strapi-cache.json",import.meta.url)));
});
after(async()=>{await vite?.close();});
test("landscape, portrait, square, small and EXIF-oriented sources produce exact JPEG center crop",async()=>{
  for(const [width,height] of [[1800,630],[630,1800],[900,900],[100,50]]){
    const svg=Buffer.from(`<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="red"/><rect x="${width*.4}" y="${height*.4}" width="${width*.2}" height="${height*.2}" fill="#00ff00"/></svg>`);
    const bytes=await renderOg(svg);
    const meta=await sharp(bytes).metadata();
    assert.equal(meta.width,1200);assert.equal(meta.height,630);assert.equal(meta.format,"jpeg");
    const {data}=await sharp(bytes).extract({left:600,top:315,width:1,height:1}).raw().toBuffer({resolveWithObject:true});
    assert.ok(data[1]>240 && data[0]<15,"center landmark preserved");
  }
  const oriented=await sharp({create:{width:300,height:600,channels:3,background:"red"}}).jpeg().withMetadata({orientation:6}).toBuffer();
  const meta=await sharp(await renderOg(oriented)).metadata();
  assert.equal(meta.width,1200);assert.equal(meta.height,630);assert.ok(!meta.orientation||meta.orientation===1);
  assert.notEqual(ogFilename(Buffer.from("a")),ogFilename(Buffer.from("b")));
  await assert.rejects(()=>renderOg(Buffer.from("not an image")));
});
test("configured live CMS wins over snapshots; HTTP and off-origin failures are explicit",async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),"og-test-"));
  try{
    await fs.writeFile(path.join(tmp,"same.jpg"),"old");
    const bytes=await loadOgSource("/strapi/uploads/same.jpg",{cmsOrigin:"https://cms.test",uploadsDir:tmp,
      fetcher:async(url)=>{assert.equal(url.href,"https://cms.test/strapi/uploads/same.jpg");return new Response("new");}});
    assert.equal(bytes.toString(),"new");
    await assert.rejects(()=>loadOgSource("/strapi/uploads/same.jpg",{cmsOrigin:"https://cms.test",fetcher:async()=>new Response("",{status:404})}),/HTTP 404/);
    await assert.rejects(()=>loadOgSource("https://evil.test/private",{cmsOrigin:"https://cms.test"}),/origin/);
    await assert.rejects(()=>loadOgSource("/strapi/uploads/..%2Fsecret",{cmsOrigin:"",uploadsDir:tmp}),/Unsafe/);
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});
test("every HU/EN detail uses generated featured image, matching schema and correct metadata",()=>{
  for(const locale of ["hu","en"])for(const collection of ["projects","blogPosts"]){
    for(const record of cache[locale][collection]){
      const route=(collection==="blogPosts"?"blog":locale==="hu"?"projektek":"projects");
      const meta=seo.getPageMeta(`${locale==="en"?"/en":""}/${route}/${record.slug}`,locale);
      assert.match(meta.ogImage,/^\/media\/og\/[a-f0-9]{64}\.jpg$/);
      assert.equal(meta.ogImageAlt,record.image?record.imageAlt||"":"");
      const html=seo.buildMetaTags(meta);
      assert.ok(html.includes('property="og:image:width" content="1200"'));
      assert.ok(html.includes('property="og:image:height" content="630"'));
      const nodes=seo.buildJsonLd(meta).map(s=>JSON.parse(s.match(/>([\s\S]*)<\/script>/)[1]));
      const article=nodes.find(n=>n["@type"]==="BlogPosting");
      if(collection==="blogPosts"){
        assert.equal(article.image,`${seo.SITE_URL}${meta.ogImage}`);
        assert.equal(article.datePublished,meta.article.publishedTime);
        assert.equal(article.dateModified,meta.article.modifiedTime);
      } else assert.equal(article,undefined);
    }
  }
});
test("alt changes and navigation clear old image attributes without inventing fallback alt",()=>{
  const record=cache.hu.blogPosts[0];
  const first=og.featuredOgImage({...record,seo:{ogImage:"/wrong.jpg"},imageAlt:'CMS & "alt"'});
  assert.notEqual(first.ogImage,"/wrong.jpg");assert.equal(first.ogImageAlt,'CMS & "alt"');
  const head=new Map();
  const sync=m=>og.syncOgImageProperties(m,(k,v)=>head.set(k,v),k=>head.delete(k));
  sync(first);assert.equal(head.get("og:image:alt"),'CMS & "alt"');
  sync(og.featuredOgImage({...record,imageAlt:""}));assert.equal(head.has("og:image:alt"),false);
  sync({});assert.equal(head.size,0);
  const fallback=og.featuredOgImage({image:"",imageAlt:"stale"});
  assert.equal(fallback.ogImageAlt,"");assert.equal(fallback.ogImageWidth,1200);
  assert.match(fallback.ogImage,/\/media\/og\//);
});
