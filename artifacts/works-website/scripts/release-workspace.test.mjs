import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  approvalHash, assertUnrelatedUnchanged, inReleaseScope, scopedEntries, snapshotFiles,
} from "./release-workspace.mjs";
import { buildDiff } from "./release-website.mjs";

test("only explicit deployment code and imported assets are approved", () => {
  for (const path of [
    "artifacts/works-website/src/seo-data.ts",
    "artifacts/api-server/src/index.ts",
    "artifacts/strapi/src/api/blog-post/schema.ts",
    "artifacts/strapi/translation/hu-to-en.json",
    "lib/api-zod/src/index.ts",
    "pnpm-lock.yaml",
    "attached_assets/New_logo_1773998946128.png",
  ]) assert.equal(inReleaseScope(path), true, path);
  for (const path of [
    "artifacts/mockup-sandbox/src/index.ts",
    "artifacts/strapi/public/uploads/candidate-cv.pdf",
    "artifacts/strapi/.env",
    "artifacts/strapi/src/secret.pem",
    "artifacts/strapi/.strapi/client/app.js",
    "artifacts/strapi/.strapi-updater.json",
    "artifacts/strapi/scripts/generate-legacy-blog-hu.mjs",
    "artifacts/strapi/translation/review-required.md",
    "artifacts/works-website/.replit-artifact/artifact.toml",
    "artifacts/works-website/dist/index.html",
    "attached_assets/candidate-cv.pdf",
    "screenshots/snapshot.png",
    ".replit",
  ]) assert.equal(inReleaseScope(path), false, path);
});

test("takes a real file snapshot, detects scoped deletions and excludes uploads", () => {
  const dir = mkdtempSync(join(tmpdir(), "works-release-workspace-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: dir });
    const source = "artifacts/strapi/src/api/blog-post/schema.ts";
    const removed = "artifacts/strapi/src/api/old/schema.ts";
    const upload = "artifacts/strapi/public/uploads/user.pdf";
    for (const path of [source, removed, upload]) {
      mkdirSync(join(dir, path, ".."), { recursive: true });
      writeFileSync(join(dir, path), path);
    }
    execFileSync("git", ["add", source, removed, upload], { cwd: dir });
    unlinkSync(join(dir, removed));
    const local = snapshotFiles(dir);
    assert.deepEqual([...local.keys()], [source]);
    const remote = scopedEntries([
      { path: removed, type: "blob", sha: "remote", mode: "100644" },
      { path: upload, type: "blob", sha: "remote", mode: "100644" },
    ]);
    assert.deepEqual(buildDiff(local, remote).map(({ status, path }) => [status, path]), [
      ["A", source], ["D", removed],
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("approval binds remote head, full approved snapshot and proposed deletions", () => {
  const local = new Map([["artifacts/strapi/src/a.ts", { sha: "one", mode: "100644" }]]);
  const diff = [{ path: "artifacts/strapi/src/old.ts", status: "D", sha: null, mode: "100644" }];
  const original = approvalHash("head", local, diff);
  assert.notEqual(original, approvalHash("new-head", local, diff));
  assert.notEqual(original, approvalHash("head", new Map([
    ["artifacts/strapi/src/a.ts", { sha: "two", mode: "100644" }],
  ]), diff));
  assert.notEqual(original, approvalHash("head", local, []));
});

test("candidate must preserve every unrelated remote blob", () => {
  const original = [
    { path: "artifacts/strapi/public/uploads/file.jpg", type: "blob", sha: "media", mode: "100644" },
    { path: ".replit", type: "blob", sha: "development", mode: "100644" },
    { path: "artifacts/works-website/src/index.ts", type: "blob", sha: "old", mode: "100644" },
  ];
  assert.doesNotThrow(() => assertUnrelatedUnchanged(original, [
    ...original.slice(0, 2),
    { ...original[2], sha: "new" },
  ]));
  assert.throws(() => assertUnrelatedUnchanged(original, [
    { ...original[0], sha: "altered" }, ...original.slice(1),
  ]), /unrelated remote file/);
  assert.throws(() => assertUnrelatedUnchanged(original, original.slice(1)), /outside release scope/);
  assert.throws(() => scopedEntries([
    { path: "artifacts/strapi/src/vendor", type: "commit", sha: "gitlink", mode: "160000" },
  ]), /Unsupported Git object/);
});