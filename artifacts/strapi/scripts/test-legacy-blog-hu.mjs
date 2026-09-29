import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => JSON.parse(fs.readFileSync(path.resolve(root, relative), "utf8"));
const translations = read("strapi/translation/legacy-blog-hu.json").records;
const cache = read("works-website/src/data/strapi-cache.json");
const source = read("strapi/scripts/squarespace-posts.json");
const urls = (text) => [...(text || "").matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
assert.equal(translations.length, 9);
assert.equal(new Set(translations.map((r) => r.slug)).size, 9);
for (const record of translations) {
  const original = source.find((post) => post.slug === record.slug);
  const hu = cache.hu.blogPosts.find((post) => post.slug === record.slug);
  const en = cache.en.blogPosts.find((post) => post.documentId === record.documentId);
  assert.ok(original && hu && en, `missing source/locale: ${record.slug}`);
  assert.equal(record.documentId, hu.documentId);
  assert.equal(record.documentId, en.documentId);
  assert.equal(record.content.length, original.blocks.length);
  assert.equal(hu.content.length, en.content.length);
  assert.equal(hu.image, en.image, `hero media changed: ${record.slug}`);
  assert.deepEqual(hu.content.filter((b) => b.type === "image").map((b) => b.content),
    en.content.filter((b) => b.type === "image").map((b) => b.content),
    `body media changed: ${record.slug}`);
  assert.equal(hu.title, record.title);
  assert.equal(hu.excerpt, record.excerpt);
  assert.notEqual(hu.title, en.title, `untranslated title: ${record.slug}`);
  for (const [i, block] of record.content.entries()) {
    assert.equal(block.type, original.blocks[i].type, `structure changed: ${record.slug}[${i}]`);
    if (block.type === "image") {
      assert.equal(block.caption, hu.content[i].caption);
      assert.ok(block.caption.length <= 255);
    } else {
      assert.equal(block.content, hu.content[i].content);
      assert.ok(block.content.trim());
      assert.deepEqual(urls(block.content), urls(original.blocks[i].markdown),
        `links changed: ${record.slug}[${i}]`);
    }
  }
}
console.log("Nine HU translations: all blocks, links, media and EN/HU document identities verified.");