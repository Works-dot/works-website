import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { verifyLegacyHuTranslation } from "./fetch-strapi-data.mjs";

const packageUrl = new URL("../../strapi/translation/legacy-blog-hu.json", import.meta.url);
const cacheUrl = new URL("../src/data/strapi-cache.json", import.meta.url);
const translation = JSON.parse(readFileSync(packageUrl, "utf8"));
const cache = JSON.parse(readFileSync(cacheUrl, "utf8"));
const copy = () => structuredClone(cache);

test("release guard allows editorial HU changes and intentional deletion", () => {
  assert.equal(translation.records.length, 9);
  assert.doesNotThrow(() => verifyLegacyHuTranslation(copy(), translation));
  const edited = copy();
  const changed = edited.hu.blogPosts.find(
    (item) => item.documentId === translation.records[0].documentId,
  );
  changed.title = "Szerkesztett magyar cím";
  changed.excerpt = "Új szerkesztői összefoglaló.";
  changed.content[0].content = "Új magyar cikk kezdete.";
  assert.doesNotThrow(() => verifyLegacyHuTranslation(edited, translation));
  const deleted = copy();
  deleted.hu.blogPosts = deleted.hu.blogPosts.filter(
    (post) => post.documentId !== translation.records[0].documentId,
  );
  assert.doesNotThrow(() => verifyLegacyHuTranslation(deleted, translation));
  const allDeleted = copy();
  allDeleted.hu.blogPosts = [];
  assert.doesNotThrow(() => verifyLegacyHuTranslation(allDeleted, translation));
  const malformed = { ...translation, records: translation.records.slice(1) };
  assert.throws(() => verifyLegacyHuTranslation(copy(), malformed), /Invalid nine-post/);
});

test("known original English title/body or fresh EN match rejects untranslated HU", () => {
  const wrongLocale = copy();
  wrongLocale.hu.blogPosts = wrongLocale.en.blogPosts;
  assert.throws(() => verifyLegacyHuTranslation(wrongLocale, translation), /original English/);
  const english = copy();
  const post = english.hu.blogPosts.find(
    (item) => item.documentId === translation.records[0].documentId,
  );
  const source = english.en.blogPosts.find((item) => item.documentId === post.documentId);
  post.content = structuredClone(source.content);
  assert.throws(() => verifyLegacyHuTranslation(english, translation), /original English/);
  source.content[0].content = "Updated English opening";
  assert.throws(() => verifyLegacyHuTranslation(english, translation), /original English/);
  const englishTitle = copy();
  englishTitle.hu.blogPosts.find(
    (item) => item.documentId === translation.records[0].documentId,
  ).title = source.title;
  assert.throws(() => verifyLegacyHuTranslation(englishTitle, translation), /original English/);
  // Live EN editing cannot make the original English fingerprint disappear.
  englishTitle.en.blogPosts.find((item) => item.documentId === post.documentId).title = "A revised English title";
  assert.throws(() => verifyLegacyHuTranslation(englishTitle, translation), /original English/);
});

test("unavailable fetch results fail closed; EN is not rewritten", () => {
  const absent = copy();
  delete absent.hu;
  assert.throws(() => verifyLegacyHuTranslation(absent, translation), /Published HU\/EN blog lists missing/);
  const edited = copy();
  edited.hu.blogPosts[0].title = "Egy szerkesztett magyar cím";
  verifyLegacyHuTranslation(edited, translation);
  assert.deepEqual(edited.en, cache.en);
});