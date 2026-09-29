import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildDiff,
  gitBlobSha,
  planHash,
  readFilesManifest,
  assertUnselectedUnchanged,
  selectedEntries,
  snapshotLocalFiles,
  websiteEntries,
} from "./release-website.mjs";

test("computes Git-compatible blob hashes", () => {
  assert.equal(gitBlobSha(Buffer.from("test\n")), "9daeafb9864cf43055ae93beb0afd6c7d144bfa4");
});

test("plans a tracked file deletion", () => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "works-release-test-"));
  try {
    const websiteRoot = "artifacts/works-website";
    const path = `${websiteRoot}/deleted.txt`;
    mkdirSync(join(workspaceRoot, websiteRoot), { recursive: true });
    writeFileSync(join(workspaceRoot, path), "delete me\n");
    execFileSync("git", ["init", "-q"], { cwd: workspaceRoot });
    execFileSync("git", ["add", path], { cwd: workspaceRoot });
    unlinkSync(join(workspaceRoot, path));

    const local = snapshotLocalFiles({ workspaceRoot, websiteRoot });
    const remote = new Map([[path, { sha: "abc", mode: "100755" }]]);
    assert.deepEqual(buildDiff(local, remote), [
      { path, status: "D", sha: null, mode: "100755" },
    ]);
  } finally {
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

test("ignores other artifacts and rejects unsupported scoped objects", () => {
  const entries = websiteEntries([
    {
      path: "artifacts/api-server/index.ts",
      type: "blob",
      mode: "100644",
      sha: "outside",
    },
    {
      path: "artifacts/works-website/index.ts",
      type: "blob",
      mode: "100644",
      sha: "inside",
    },
  ]);
  assert.deepEqual([...entries], [
    [
      "artifacts/works-website/index.ts",
      { sha: "inside", mode: "100644" },
    ],
  ]);
  assert.throws(
    () =>
      websiteEntries([
        {
          path: "artifacts/works-website/vendor",
          type: "commit",
          mode: "160000",
          sha: "gitlink",
        },
      ]),
    /Unsupported Git object/,
  );
});

test("binds approval to both remote head and local snapshot", () => {
  const snapshot = new Map([
    ["artifacts/works-website/index.ts", { sha: "one", mode: "100644" }],
  ]);
  assert.notEqual(planHash("head-one", snapshot), planHash("head-two", snapshot));
  assert.notEqual(
    planHash("head-one", snapshot),
    planHash(
      "head-one",
      new Map([
        ["artifacts/works-website/index.ts", { sha: "two", mode: "100644" }],
      ]),
    ),
  );
});

test("explicit manifest selects only named website and Strapi files, including tracked deletion", () => {
  const root = mkdtempSync(join(tmpdir(), "works-release-test-"));
  try {
    mkdirSync(join(root, "artifacts/works-website"), { recursive: true });
    mkdirSync(join(root, "artifacts/strapi/scripts"), { recursive: true });
    const deleted = "artifacts/strapi/scripts/old.mjs";
    const updated = "artifacts/works-website/index.ts";
    const unrelated = "artifacts/works-website/other.ts";
    writeFileSync(join(root, deleted), "old");
    writeFileSync(join(root, updated), "new");
    writeFileSync(join(root, unrelated), "untouched");
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["add", deleted, updated, unrelated], { cwd: root });
    unlinkSync(join(root, deleted));
    writeFileSync(join(root, "selection.json"), JSON.stringify([updated, deleted]));
    const selected = readFilesManifest("selection.json", root);
    assert.deepEqual(selected, [deleted, updated]);
    const local = snapshotLocalFiles({ workspaceRoot: root, selectedPaths: selected });
    assert.deepEqual([...local.keys()], [updated]);
    const remote = selectedEntries([
      { path: deleted, type: "blob", mode: "100644", sha: "old" },
      { path: updated, type: "blob", mode: "100644", sha: "old" },
      { path: unrelated, type: "blob", mode: "100644", sha: "untouched" },
    ], selected);
    assert.deepEqual(buildDiff(local, remote).map(({ path, status }) => [path, status]),
      [[deleted, "D"], [updated, "M"]]);
    assert.notEqual(planHash("head", local, selected), planHash("head", local, [updated]));
    assert.notEqual(planHash("head", local, selected), planHash("other-head", local, selected));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("manifest rejects traversal, directories, symlinks, uploads and untracked deletion", () => {
  const root = mkdtempSync(join(tmpdir(), "works-release-test-"));
  try {
    mkdirSync(join(root, "artifacts/strapi/scripts"), { recursive: true });
    mkdirSync(join(root, "artifacts/works-website"), { recursive: true });
    writeFileSync(join(root, "real.json"), "[]");
    symlinkSync("real.json", join(root, "link.json"));
    assert.throws(() => readFilesManifest("link.json", root), /regular file/);
    execFileSync("git", ["init", "-q"], { cwd: root });
    const invalid = [
      "artifacts/strapi/../../api-server/secret",
      "artifacts/strapi/public/uploads/photo.jpg",
      "artifacts/strapi/scripts",
      "artifacts/api-server/index.ts",
      "artifacts/works-website//index.ts",
      "artifacts/works-website/./index.ts",
    ];
    for (const path of invalid) {
      writeFileSync(join(root, "selection.json"), JSON.stringify([path]));
      if (path === "artifacts/strapi/scripts") {
        const selected = readFilesManifest("selection.json", root);
        assert.throws(() => snapshotLocalFiles({ workspaceRoot: root, selectedPaths: selected }),
          /regular files/);
      } else assert.throws(() => readFilesManifest("selection.json", root));
    }
    writeFileSync(join(root, "selection.json"),
      JSON.stringify(["artifacts/works-website/missing.ts"]));
    assert.throws(() => snapshotLocalFiles({
      workspaceRoot: root, selectedPaths: readFilesManifest("selection.json", root),
    }), /Missing untracked/);
    symlinkSync(join(root, "real.json"), join(root, "artifacts/strapi/scripts/link.mjs"));
    writeFileSync(join(root, "selection.json"),
      JSON.stringify(["artifacts/strapi/scripts/link.mjs"]));
    assert.throws(() => snapshotLocalFiles({
      workspaceRoot: root, selectedPaths: readFilesManifest("selection.json", root),
    }), /regular files/);
    symlinkSync(join(root, "artifacts/strapi/scripts"), join(root, "artifacts/works-website/linked"));
    writeFileSync(join(root, "selection.json"),
      JSON.stringify(["artifacts/works-website/linked/nested.mjs"]));
    assert.throws(() => readFilesManifest("selection.json", root), /ancestor/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unselected remote tree files remain byte-for-byte identical by object identity", () => {
  const selected = ["artifacts/strapi/scripts/change.mjs"];
  const before = [
    { path: selected[0], type: "blob", mode: "100644", sha: "old" },
    { path: "artifacts/strapi/public/uploads/image.jpg", type: "blob", mode: "100644", sha: "image" },
    { path: "artifacts/works-website/other.ts", type: "blob", mode: "100755", sha: "other" },
  ];
  const after = before.map((entry) => ({ ...entry }));
  after[0].sha = "new";
  assert.doesNotThrow(() => assertUnselectedUnchanged(before, after, selected));
  after[1].sha = "changed";
  assert.throws(() => assertUnselectedUnchanged(before, after, selected), /unselected/);
  after[1].sha = "image";
  after.pop();
  assert.throws(() => assertUnselectedUnchanged(before, after, selected), /outside release/);
  assert.throws(() => selectedEntries([
    { path: selected[0], type: "commit", mode: "160000", sha: "submodule" },
  ], selected), /Unsupported/);
});