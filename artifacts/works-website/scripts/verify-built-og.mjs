// Verify the actual prerendered pages and image HTTP responses, not just helpers.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { once } from "node:events";
import sharp from "sharp";
import { createApp } from "../server.mjs";
const cache = JSON.parse(await fs.readFile(new URL("../src/data/strapi-cache.json", import.meta.url)));
const server = createApp({ canonicalOrigin: null }).listen(0, "127.0.0.1");
await once(server, "listening");
const origin = `http://127.0.0.1:${server.address().port}`;
const images = new Set();
let pages = 0;
const escape = value => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
try {
  for (const locale of ["hu", "en"]) {
    for (const collection of ["projects", "blogPosts"]) {
      for (const record of cache[locale][collection]) {
        const section = collection === "blogPosts" ? "blog" : locale === "hu" ? "projektek" : "projects";
        const route = `${locale === "en" ? "/en" : ""}/${section}/${record.slug}/`;
        const response = await fetch(origin + route);
        assert.equal(response.status, 200, route);
        const html = await response.text();
        const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
        assert.ok(og, route);
        const imagePath = new URL(og).pathname;
        assert.match(imagePath, /^\/media\/og\/[a-f0-9]{64}\.jpg$/);
        assert.ok(html.includes('property="og:image:width" content="1200"'));
        assert.ok(html.includes('property="og:image:height" content="630"'));
        const alt = record.image ? record.imageAlt || "" : "";
        if (alt) assert.ok(html.includes(`property="og:image:alt" content="${escape(alt)}"`), route);
        else assert.ok(!html.includes('property="og:image:alt"'), route);
        const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
        const article = schemas.find(n => n["@type"] === "BlogPosting");
        if (collection === "blogPosts") assert.equal(article.image, og, route);
        else assert.equal(article, undefined);
        if (!images.has(imagePath)) {
          const image = await fetch(origin + imagePath);
          assert.equal(image.status, 200);
          assert.match(image.headers.get("content-type"), /^image\/jpeg/);
          assert.match(image.headers.get("cache-control"), /immutable/);
          const meta = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
          assert.equal(meta.width, 1200); assert.equal(meta.height, 630);
          images.add(imagePath);
        }
        pages++;
      }
    }
  }
  const missing = await fetch(origin + "/media/og/missing.jpg");
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), "");
  console.log(`PASS: ${pages} HU/EN detail pages, ${images.size} served OG JPEGs, exact schema equality, alt/dimensions and missing-file 404.`);
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
