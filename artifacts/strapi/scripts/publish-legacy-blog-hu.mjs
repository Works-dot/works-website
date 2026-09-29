// Targeted production admin-API release. No startup migration or environment switch.
// Run from the repository root: node artifacts/strapi/scripts/publish-legacy-blog-hu.mjs prepare|apply|verify [journal-path]
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const records = JSON.parse(fs.readFileSync(path.join(root, "translation/legacy-blog-hu.json"), "utf8")).records;
const expected = new Set([
  "how-do-we-pay-online", "the-economic-effects-of-covid-19", "shipping-and-receiving",
  "messages-during-shipping", "issues-with-packages", "microinteractions-when-how-and-why",
  "why-lofi-design-is-important-in-the-design-process", "how-state-diagram-can-help-designers",
  "is-the-ux-designer-a-dying-breed-mlfg5",
]);
const base = "https://admin.worksdot.hu/strapi";
const endpoint = "/content-manager/collection-types/api::blog-post.blog-post";
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const deep = (value) => structuredClone(value);
const assertSame = (a, b, message) => {
  if (!isDeepStrictEqual(a, b)) throw Error(message);
};
const blockContent = (post) => post.contentBlocks.map((block) => {
  if (block.__component === "content.text-block") return { type: "text", content: block.body };
  if (block.__component === "content.highlight-block") return { type: "highlight", content: block.quote };
  if (block.__component === "content.image-block") return { type: "image", caption: block.caption || "" };
  throw Error(`Unknown component ${block.__component}`);
});
const content = (post) => ({ title: post.title, excerpt: post.excerpt || "", blocks: blockContent(post) });
const wanted = (record) => ({ title: record.title, excerpt: record.excerpt, blocks: record.content });
// Ignore only Strapi row IDs for document/component instances and audit metadata.
// In particular, retain media IDs, URLs, relation values and locale links.
function comparable(value, parent = "") {
  // Admin expands each opposite-locale entry into a full live document. A HU
  // edit legitimately changes EN.localizations[0], but never the EN document.
  if (parent === "localizations" && Array.isArray(value)) {
    return value.map((item) => ({ documentId: item.documentId, locale: item.locale }));
  }
  if (Array.isArray(value)) return value.map((item) => comparable(item, parent));
  if (value && typeof value === "object") {
    const row = value.documentId != null || value.__component != null || parent === "seo";
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["createdAt", "updatedAt", "publishedAt", "createdBy", "updatedBy", "status"].includes(key)
        && !(key === "id" && (row || parent === "")))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, comparable(item, key)]));
  }
  return value;
}
function translated(post, record) {
  const result = deep(post);
  result.title = record.title;
  result.excerpt = record.excerpt;
  result.contentBlocks.forEach((block, i) => {
    const next = record.content[i];
    assert.equal(next.type, blockContent({ contentBlocks: [block] })[0].type);
    if (next.type === "image") block.caption = next.caption;
    else if (next.type === "text") block.body = next.content;
    else block.quote = next.content;
  });
  return result;
}
function checkRecord(record, versions) {
  const { hd, hp, ed, ep } = versions;
  assert.ok(hd && hp && ed && ep, `${record.slug}: missing HU/EN draft/published`);
  for (const [key, post] of Object.entries(versions)) {
    assert.equal(post.documentId, record.documentId, `${record.slug}: ${key} document ID`);
    assert.equal(post.locale, key[0] === "h" ? "hu" : "en", `${record.slug}: ${key} locale`);
    assert.ok(post.id && post.slug, `${record.slug}: ${key} identity`);
    assert.ok(post.image?.id, `${record.slug}: ${key} hero missing`);
    for (const block of post.contentBlocks) {
      if (block.__component === "content.image-block") assert.ok(block.image?.id, `${record.slug}: ${key} body media missing`);
    }
    assert.ok(post.localizations?.some((l) => l.documentId === record.documentId
      && l.locale === (key[0] === "h" ? "en" : "hu")), `${record.slug}: ${key} locale link missing`);
  }
  assert.equal(hd.slug, record.slug);
  assert.equal(hp.slug, record.slug);
  assertSame(comparable(ed), comparable(ep), `${record.slug}: pending EN draft edit`);
  assertSame(comparable(hd), comparable(hp), `${record.slug}: pending HU draft edit`);
  for (const post of [hd, hp]) {
    assert.equal(hash(content(post)), record.sourceChecksum, `${record.slug}: source fingerprint changed`);
    assertSame(blockContent(post).map((b) => b.type), record.content.map((b) => b.type));
  }
}
function validateSet(snapshot) {
  assert.equal(records.length, 9);
  assert.equal(new Set(records.map((r) => r.slug)).size, 9);
  assert.equal(new Set(records.map((r) => r.documentId)).size, 9);
  assert.ok(records.every((r) => expected.has(r.slug) && r.sourceChecksum && r.title
    && r.excerpt && Array.isArray(r.content)));
  for (const record of records) checkRecord(record, snapshot[record.documentId]);
}
const key = (locale, status) => `${locale === "hu" ? "h" : "e"}${status === "draft" ? "d" : "p"}`;
async function connect() {
  assert.ok(process.env.STRAPI_ADMIN_EMAIL && process.env.STRAPI_ADMIN_PASSWORD,
    "STRAPI_ADMIN_EMAIL/PASSWORD not available in this process");
  const response = await fetch(`${base}/admin/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.STRAPI_ADMIN_EMAIL, password: process.env.STRAPI_ADMIN_PASSWORD }),
  });
  assert.equal(response.status, 200, `Admin login HTTP ${response.status}`);
  const token = (await response.json()).data?.token;
  assert.ok(token, "Admin login returned no token");
  return async (url, method = "GET", body) => {
    const res = await fetch(`${base}${url}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.ok(res.ok, `${method} ${url}: HTTP ${res.status}`);
    return res.json();
  };
}
async function readOne(api, record) {
  const result = {};
  for (const locale of ["hu", "en"]) for (const status of ["draft", "published"]) {
    const response = await api(`${endpoint}/${record.documentId}?locale=${locale}&status=${status}`);
    result[key(locale, status)] = response.data;
  }
  return result;
}
async function readAll(api) {
  const result = {};
  for (const record of records) result[record.documentId] = await readOne(api, record);
  return result;
}
const backupDir = path.resolve(root, "../../.local/backups");
const save = (name, object, exclusive = false) => {
  const text = JSON.stringify(object, null, 2) + "\n";
  if (exclusive) fs.writeFileSync(name, text, { mode: 0o600, flag: "wx" });
  else {
    const tmp = `${name}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, text, { mode: 0o600, flag: "wx" });
    fs.renameSync(tmp, name);
  }
};
const load = (name) => {
  assert.equal(fs.statSync(name).mode & 0o777, 0o600, `${name}: unsafe file permissions`);
  return JSON.parse(fs.readFileSync(name, "utf8"));
};
const getJournal = (name) => {
  const journal = load(name);
  assert.equal(journal.format, "works-nine-hu-admin-release-v1");
  assert.equal(journal.base, base);
  assert.equal(journal.recordsHash, hash(records), "Translation package changed since prepare");
  const backup = load(journal.backup);
  assert.equal(hash(backup), journal.backupHash, "Backup has changed");
  validateSet(backup);
  return { journal, backup };
};
function checkCurrent(backup, current, journal) {
  for (const record of records) {
    const id = record.documentId;
    const original = backup[id], actual = current[id];
    for (const field of ["ed", "ep"]) assertSame(comparable(actual[field]), comparable(original[field]),
      `${record.slug}: EN ${field} changed`);
    const state = journal.progress[id] || "original";
    const target = comparable(translated(original.hp, record));
    if (state === "complete") {
      for (const field of ["hd", "hp"]) assertSame(comparable(actual[field]), target,
        `${record.slug}: completed HU ${field} differs`);
    } else if (state === "updating" || state === "draft-ready" || state === "publishing") {
      if (state === "publishing") {
        assert.ok(JSON.stringify(comparable(actual.hp)) === JSON.stringify(comparable(original.hp))
          || JSON.stringify(comparable(actual.hp)) === JSON.stringify(target),
        `${record.slug}: unexpected published content`);
      } else assertSame(comparable(actual.hp), comparable(original.hp),
        `${record.slug}: published content changed during update`);
      const draft = comparable(actual.hd);
      assert.ok(JSON.stringify(draft) === JSON.stringify(target)
        || (state === "updating" && JSON.stringify(draft) === JSON.stringify(comparable(original.hd))),
      `${record.slug}: draft concurrently edited`);
    } else {
      assert.equal(state, "original", `${record.slug}: invalid journal state`);
      for (const field of ["hd", "hp"]) assertSame(comparable(actual[field]), comparable(original[field]),
        `${record.slug}: concurrent HU ${field} edit`);
    }
  }
}
async function publicVerify(record, original) {
  const getPublic = async (locale) => {
    const populate = "populate[0]=image&populate[1]=tags&populate[2]=contentBlocks.image&populate[3]=author&populate[4]=seo.ogImage";
    const res = await fetch(`${base}/api/blog-posts/${record.documentId}?locale=${locale}&${populate}`);
    assert.ok(res.ok, `${record.slug}: public ${locale} HTTP ${res.status}`);
    return (await res.json()).data;
  };
  const data = await getPublic("hu");
  assert.equal(data?.documentId, record.documentId);
  assert.equal(data?.slug, record.slug);
  assert.equal(data?.title, record.title, `${record.slug}: public HU title`);
  assert.equal(data?.excerpt || "", record.excerpt, `${record.slug}: public HU excerpt`);
  // Admin publication verifies every block; public REST must expose the updated text too.
  assertSame(blockContent(data), record.content, `${record.slug}: public HU blocks`);
  const imageIds = (post) => post.contentBlocks
    .filter((block) => block.__component === "content.image-block").map((block) => block.image?.id);
  assert.equal(data.image?.id, original.hp.image.id, `${record.slug}: public HU hero changed`);
  assertSame(imageIds(data), imageIds(original.hp), `${record.slug}: public HU body media changed`);
  const en = await getPublic("en");
  assert.equal(en?.documentId, record.documentId, `${record.slug}: public EN identity`);
  assertSame(content(en), content(original.ep), `${record.slug}: public EN content changed`);
  assert.equal(en.image?.id, original.ep.image.id, `${record.slug}: public EN hero changed`);
  assertSame(imageIds(en), imageIds(original.ep), `${record.slug}: public EN body media changed`);
}
async function main() {
  const [mode, journalName] = process.argv.slice(2);
  assert.ok(["prepare", "apply", "verify"].includes(mode),
    "Usage: publish-legacy-blog-hu.mjs prepare|apply|verify [journal-path]");
  fs.mkdirSync(backupDir, { recursive: true });
  const api = await connect();
  if (mode === "prepare") {
    assert.ok(!journalName, "prepare creates its own journal");
    const snapshot = await readAll(api);
    validateSet(snapshot); // All nine validated before any write, including backup.
    const stamp = Date.now();
    const backup = path.join(backupDir, `legacy-blog-hu-${stamp}.json`);
    const journalPath = path.join(backupDir, `legacy-blog-hu-${stamp}.journal.json`);
    save(backup, snapshot, true);
    const journal = {
      format: "works-nine-hu-admin-release-v1", base, recordsHash: hash(records),
      backup, backupHash: hash(snapshot), progress: {},
    };
    save(journalPath, journal, true);
    console.log(`Prepared nine records; mode-0600 backup and resumable journal: ${journalPath}`);
    return;
  }
  assert.ok(journalName, "Pass the journal path printed by prepare");
  const { journal, backup } = getJournal(path.resolve(journalName));
  const checkpoint = (record, state) => {
    journal.progress[record.documentId] = state;
    save(path.resolve(journalName), journal);
  };
  let current = await readAll(api);
  checkCurrent(backup, current, journal);
  if (mode === "apply") for (const record of records) {
    const id = record.documentId;
    if (journal.progress[id] === "complete") continue;
    current = await readAll(api);
    checkCurrent(backup, current, journal);
    const original = backup[id];
    if (journal.progress[id] === "publishing"
      && JSON.stringify(comparable(current[id].hp)) === JSON.stringify(comparable(translated(original.hp, record)))) {
      checkpoint(record, "complete");
      console.log(`${record.slug}: prior publication confirmed`);
      continue;
    }
    if (JSON.stringify(comparable(current[id].hd)) !== JSON.stringify(comparable(translated(original.hd, record)))) {
      checkpoint(record, "updating");
      const blocks = original.hd.contentBlocks.map((block, i) => {
        const next = record.content[i];
        if (next.type === "image") return {
          __component: block.__component, id: block.id, image: block.image.id, caption: next.caption,
        };
        return { __component: block.__component, id: block.id,
          [next.type === "text" ? "body" : "quote"]: next.content };
      });
      await api(`${endpoint}/${id}?locale=hu`, "PUT",
        { title: record.title, excerpt: record.excerpt, contentBlocks: blocks });
    }
    const afterDraft = await readAll(api);
    checkCurrent(backup, afterDraft, journal);
    assertSame(comparable(afterDraft[id].hd), comparable(translated(original.hd, record)),
      `${record.slug}: draft update changed unrelated fields`);
    assertSame(afterDraft[id].hd.contentBlocks.map((b) => b.id),
      original.hd.contentBlocks.map((b) => b.id), `${record.slug}: component IDs changed`);
    checkpoint(record, "draft-ready");
    // Publishing is not atomic across all nine: journal + backup allow fail-closed resume.
    checkpoint(record, "publishing");
    await api(`${endpoint}/${id}/actions/publish?locale=hu`, "POST", { locale: "hu" });
    const published = await readAll(api);
    // Mark complete only after full post-publication checks.
    journal.progress[id] = "complete";
    checkCurrent(backup, published, journal);
    checkpoint(record, "complete");
    console.log(`${record.slug}: published and checked`);
  }
  current = await readAll(api);
  checkCurrent(backup, current, journal);
  assert.ok(records.every((r) => journal.progress[r.documentId] === "complete"),
    "Release incomplete; resume using apply and the same journal");
  for (const record of records) await publicVerify(record, backup[record.documentId]);
  console.log("Verified nine public HU translations and unchanged EN admin draft/published documents.");
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
export { blockContent, content, comparable, translated, checkRecord, validateSet, checkCurrent };