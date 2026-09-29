import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkCurrent, comparable, translated, validateSet } from "./publish-legacy-blog-hu.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(fs.readFileSync(path.join(root, "translation/legacy-blog-hu.json"))).records;
const source = JSON.parse(fs.readFileSync(path.join(root, "scripts/squarespace-posts.json")));
const clone = structuredClone;
const snapshot = {};
for (const [index, record] of records.entries()) {
  const original = source.find((s) => s.slug === record.slug);
  const blocks = original.blocks.map((block, i) => block.type === "image"
    ? { id: i + 10, __component: "content.image-block", image: { id: i + 100 }, caption: block.caption || "" }
    : { id: i + 10, __component: block.type === "text" ? "content.text-block" : "content.highlight-block",
      [block.type === "text" ? "body" : "quote"]: block.markdown });
  const base = {
    id: index + 1, documentId: record.documentId, slug: record.slug,
    title: original.title, excerpt: original.excerpt, image: { id: index + 200 },
    author: { count: 0 }, tags: { count: 0 }, seo: { id: index + 300, metaTitle: "Original" },
    contentBlocks: blocks, localizations: [{ locale: "en", documentId: record.documentId }],
  };
  const hd = { ...clone(base), locale: "hu" };
  const hp = { ...clone(base), id: index + 500, locale: "hu" };
  const ed = { ...clone(base), id: index + 1000, locale: "en",
    localizations: [{ locale: "hu", documentId: record.documentId }] };
  const ep = { ...clone(ed), id: index + 1500 };
  snapshot[record.documentId] = { hd, hp, ed, ep };
}
validateSet(snapshot);
const progress = {};
checkCurrent(snapshot, clone(snapshot), { progress });
for (const [label, mutate] of [
  ["pending HU draft", (s, id) => { s[id].hd.seo.metaTitle = "Editor change"; }],
  ["changed source", (s, id) => { s[id].hp.title = "Editor change"; }],
  ["changed EN published", (s, id) => { s[id].ep.title = "Editor change"; }],
  ["missing media", (s, id) => { s[id].hp.contentBlocks.find((b) => b.image).image = null; }],
  ["broken locale link", (s, id) => { s[id].hd.localizations = []; }],
]) {
  const copy = clone(snapshot);
  mutate(copy, records.at(-1).documentId);
  assert.throws(() => validateSet(copy), undefined, label);
}
for (const record of records) {
  const id = record.documentId;
  const current = clone(snapshot);
  current[id].hd = translated(current[id].hd, record);
  assert.throws(() => checkCurrent(snapshot, current, { progress: {} }), /concurrent HU/, "No changes without journal");
  checkCurrent(snapshot, current, { progress: { [id]: "updating" } });
  checkCurrent(snapshot, current, { progress: { [id]: "draft-ready" } });
  checkCurrent(snapshot, current, { progress: { [id]: "publishing" } });
  current[id].hp = translated(current[id].hp, record);
  checkCurrent(snapshot, current, { progress: { [id]: "publishing" } });
  checkCurrent(snapshot, current, { progress: { [id]: "complete" } });
  current[id].hp.image.id++;
  assert.throws(() => checkCurrent(snapshot, current, { progress: { [id]: "complete" } }),
    /completed HU/, "media changes must fail");
}
assert.ok(comparable(snapshot[records[0].documentId].hd));
console.log("Admin release: nine-document preconditions, fail-closed drift and resumable checkpoints passed.");