import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildDiff,
  gitBlobSha,
  planHash,
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