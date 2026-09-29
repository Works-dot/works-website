import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrateLegacyBlogHungarian } from "../src/legacy-blog-hu.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(fs.readFileSync(path.join(root, "translation/legacy-blog-hu.json"))).records;
const source = JSON.parse(fs.readFileSync(path.join(root, "scripts/squarespace-posts.json")));
const clone = (value) => structuredClone(value);
const uid = "api::blog-post.blog-post";

function makeMock() {
  const data = { hu: new Map(), en: new Map() };
  let sequence = 1000;
  for (const record of records) {
    const original = source.find((post) => post.slug === record.slug);
    assert.ok(original, record.slug);
    const entry = {
      documentId: record.documentId, slug: record.slug,
      title: original.title, excerpt: original.excerpt,
      image: { id: sequence++ }, author: { id: 77 }, tags: [{ id: 8 }],
      contentBlocks: original.blocks.map((block) => {
        if (block.type === "image") return {
          __component: "content.image-block",
          image: { id: sequence++ },
          caption: block.caption || "",
        };
        if (block.type === "text") return { __component: "content.text-block", body: block.markdown };
        if (block.type === "highlight") return { __component: "content.highlight-block", quote: block.markdown };
        throw new Error("Unexpected fixture block");
      }),
    };
    data.hu.set(record.documentId, { draft: clone(entry), published: clone(entry) });
    data.en.set(record.documentId, clone(entry));
  }
  const calls = [];
  const state = { done: false };
  const strapi = {
    store: () => ({
      get: async () => state.done,
      set: async ({ value }) => { state.done = value; },
    }),
    documents: (model) => {
      assert.equal(model, uid);
      return {
        findOne: async ({ documentId, locale, status }) => {
          calls.push({ action: "find", documentId, locale, status });
          if (locale !== "hu") throw new Error("EN read attempted");
          return clone(data.hu.get(documentId)?.[status] ?? null);
        },
        update: async ({ documentId, locale, status, data: changes }) => {
          calls.push({ action: "update", documentId, locale, status, data: clone(changes) });
          assert.equal(locale, "hu");
          assert.equal(status, "draft");
          const item = data.hu.get(documentId);
          assert.ok(item);
          const blocks = changes.contentBlocks.map((block) =>
            block.__component === "content.image-block"
              ? { ...block, image: { id: block.image } } : block);
          item.draft = { ...item.draft, ...changes, contentBlocks: blocks };
        },
        publish: async ({ documentId, locale }) => {
          calls.push({ action: "publish", documentId, locale });
          assert.equal(locale, "hu");
          const item = data.hu.get(documentId);
          item.published = clone(item.draft);
        },
      };
    },
    db: { transaction: async (callback) => {
      const snapshot = clone([...data.hu]);
      try { return await callback(); }
      catch (error) { data.hu = new Map(snapshot); throw error; }
    } },
    log: { info: () => {} },
  };
  return { data, calls, state, strapi };
}

const images = (entry) => entry.contentBlocks
  .filter((block) => block.__component === "content.image-block").map((block) => block.image.id);
const changes = (mock) => mock.calls.filter((call) => call.action === "update" || call.action === "publish");

{
  const mock = makeMock();
  const before = new Map([...mock.data.hu].map(([id, item]) => [id, clone(item.published)]));
  const enBefore = clone([...mock.data.en]);
  await migrateLegacyBlogHungarian(mock.strapi);
  assert.equal(mock.state.done, true);
  assert.equal(changes(mock).length, 18);
  assert.deepEqual([...mock.data.en], enBefore, "EN must not change");
  for (const record of records) {
    const actual = mock.data.hu.get(record.documentId);
    assert.equal(actual.published.title, record.title);
    assert.equal(actual.published.excerpt, record.excerpt);
    assert.deepEqual(actual.published, actual.draft);
    assert.equal(actual.published.slug, record.slug);
    assert.deepEqual(images(actual.published), images(before.get(record.documentId)));
    assert.deepEqual(actual.published.image, before.get(record.documentId).image);
    assert.deepEqual(actual.published.tags, before.get(record.documentId).tags);
    assert.deepEqual(actual.published.author, before.get(record.documentId).author);
  }
  const count = changes(mock).length;
  await migrateLegacyBlogHungarian(mock.strapi);
  assert.equal(changes(mock).length, count, "completed migration must be idempotent");
  mock.state.done = false;
  await migrateLegacyBlogHungarian(mock.strapi);
  assert.equal(changes(mock).length, count, "already translated content must be idempotent");
}

for (const [description, corrupt] of [
  ["missing HU document", (entry, mock, id) => mock.data.hu.delete(id)],
  ["changed published copy", (entry) => { entry.published.contentBlocks[0].body += " editor change"; }],
  ["changed draft copy", (entry) => { entry.draft.title += " editor change"; }],
  ["changed slug", (entry) => { entry.published.slug = "wrong"; }],
  ["changed block layout", (entry) => { entry.published.contentBlocks.pop(); }],
  ["missing image", (entry) => { entry.published.contentBlocks.find((b) => b.image).image = null; }],
]) {
  const mock = makeMock();
  const id = records[8].documentId; // fail late, after eight other records validated
  corrupt(mock.data.hu.get(id), mock, id);
  await assert.rejects(() => migrateLegacyBlogHungarian(mock.strapi), undefined, description);
  assert.equal(mock.state.done, false, description);
  assert.equal(changes(mock).length, 0, `${description} must abort before any write`);
}

{
  const mock = makeMock();
  const id = records[0].documentId;
  const first = mock.data.hu.get(id);
  first.published.title = first.draft.title = records[0].title;
  first.published.excerpt = first.draft.excerpt = records[0].excerpt;
  const blocks = records[0].content;
  for (const post of [first.published, first.draft]) {
    post.contentBlocks.forEach((block, i) => {
      if (blocks[i].type === "image") block.caption = blocks[i].caption;
      else if (blocks[i].type === "text") block.body = blocks[i].content;
      else block.quote = blocks[i].content;
    });
  }
  await migrateLegacyBlogHungarian(mock.strapi);
  assert.equal(changes(mock).length, 16, "previously translated post should be skipped");
}

console.log("Mock migration: guards, images, EN isolation, partial retry and idempotency passed.");