#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReplitConnectors } from "@replit/connectors-sdk";

const REPO = "Works-dot/works-website";
const BRANCH = "main";
const WEBSITE_ROOT = "artifacts/works-website";
const WORKSPACE_ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));

function fail(message) {
  throw new Error(message);
}

function git(args, cwd = WORKSPACE_ROOT) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function gitBlobSha(content) {
  const header = Buffer.from(`blob ${content.length}\0`);
  return createHash("sha1").update(header).update(content).digest("hex");
}

function parseArgs(argv) {
  let publish = false;
  let message = "";
  let approvedPlan = "";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--publish") publish = true;
    else if (argument === "--dry-run") publish = false;
    else if (argument === "--message") message = argv[++index] ?? "";
    else if (argument === "--plan") approvedPlan = argv[++index] ?? "";
    else fail(`Unknown argument: ${argument}`);
  }
  if (publish && !message.trim()) {
    fail("Publishing requires --message \"Release description\".");
  }
  if (publish && !/^[a-f0-9]{64}$/.test(approvedPlan)) {
    fail("Publishing requires the exact --plan hash printed by the approved dry run.");
  }
  return { publish, message: message.trim(), approvedPlan };
}

function listLocalFiles(workspaceRoot, websiteRoot) {
  const output = git(
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", websiteRoot],
    workspaceRoot,
  );
  return output ? output.split("\0").filter(Boolean).sort() : [];
}

export function snapshotLocalFiles({
  workspaceRoot = WORKSPACE_ROOT,
  websiteRoot = WEBSITE_ROOT,
} = {}) {
  const snapshot = new Map();
  for (const path of listLocalFiles(workspaceRoot, websiteRoot)) {
    if (!path.startsWith(`${websiteRoot}/`)) fail(`Out-of-scope path: ${path}`);
    const absolutePath = resolve(workspaceRoot, path);
    let stat;
    try {
      stat = lstatSync(absolutePath);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    if (!stat.isFile()) fail(`Only regular files can be released: ${path}`);
    const content = readFileSync(absolutePath);
    snapshot.set(path, {
      sha: gitBlobSha(content),
      mode: stat.mode & 0o111 ? "100755" : "100644",
    });
  }
  return snapshot;
}

function verifySnapshot(expected) {
  const current = snapshotLocalFiles();
  if (current.size !== expected.size) fail("Website files changed after release planning; rerun.");
  for (const [path, metadata] of expected) {
    const actual = current.get(path);
    if (!actual || actual.sha !== metadata.sha || actual.mode !== metadata.mode) {
      fail(`Website file changed after release planning: ${path}`);
    }
  }
}

async function github(connectors, path, options = {}) {
  const response = await connectors.proxy("github", `/repos/${REPO}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof body?.message === "string" ? `: ${body.message}` : "";
    fail(`GitHub request failed (${response.status})${detail}`);
  }
  return body;
}

async function githubGraphql(connectors, query, variables) {
  const response = await connectors.proxy("github", "/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json().catch(() => null);
  const graphqlError = body?.errors?.[0]?.message;
  if (!response.ok || graphqlError) {
    fail(
      `GitHub atomic ref update failed (${response.status})${
        graphqlError ? `: ${graphqlError}` : ""
      }`,
    );
  }
  return body.data;
}

async function readRemoteState(connectors) {
  const ref = await github(connectors, `/git/ref/heads/${BRANCH}`);
  const commit = await github(connectors, `/git/commits/${ref.object.sha}`);
  const tree = await github(connectors, `/git/trees/${commit.tree.sha}?recursive=1`);
  if (tree.truncated) fail("GitHub returned a truncated tree; refusing an incomplete release.");
  return { commitSha: ref.object.sha, treeSha: commit.tree.sha, entries: tree.tree };
}

export function websiteEntries(entries) {
  const scoped = new Map();
  for (const entry of entries) {
    if (!entry.path.startsWith(`${WEBSITE_ROOT}/`) || entry.type === "tree") continue;
    if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      fail(`Unsupported Git object inside website scope: ${entry.path}`);
    }
    scoped.set(entry.path, { sha: entry.sha, mode: entry.mode });
  }
  return scoped;
}

export function buildDiff(local, remote) {
  const paths = new Set([...local.keys(), ...remote.keys()]);
  return [...paths]
    .sort()
    .flatMap((path) => {
      const localEntry = local.get(path);
      const remoteEntry = remote.get(path);
      if (!localEntry) return [{ path, status: "D", sha: null, mode: remoteEntry.mode }];
      if (
        !remoteEntry ||
        localEntry.sha !== remoteEntry.sha ||
        localEntry.mode !== remoteEntry.mode
      ) {
        return [{ path, status: remoteEntry ? "M" : "A", ...localEntry }];
      }
      return [];
    });
}

export function planHash(remoteCommitSha, snapshot) {
  const files = [...snapshot].map(([path, metadata]) => ({
    path,
    mode: metadata.mode,
    sha: metadata.sha,
  }));
  return createHash("sha256")
    .update(JSON.stringify({ remoteCommitSha, files }))
    .digest("hex");
}

async function createBlobs(connectors, diff, snapshot) {
  const entries = [];
  for (const item of diff) {
    if (item.status === "D") {
      entries.push({ path: item.path, mode: item.mode, type: "blob", sha: null });
      continue;
    }
    const content = readFileSync(resolve(WORKSPACE_ROOT, item.path));
    if (gitBlobSha(content) !== snapshot.get(item.path)?.sha) {
      fail(`Website file changed while uploading: ${item.path}`);
    }
    const blob = await github(connectors, "/git/blobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
    });
    if (blob.sha !== item.sha) fail(`GitHub blob hash mismatch: ${item.path}`);
    entries.push({ path: item.path, mode: item.mode, type: "blob", sha: blob.sha });
  }
  return entries;
}

async function main() {
  const { publish, message, approvedPlan } = parseArgs(process.argv.slice(2));
  if (git(["diff", "--name-only", "--diff-filter=U"])) fail("Resolve merge conflicts first.");

  const connectors = new ReplitConnectors();
  const repository = await github(connectors, "");
  if (typeof repository.node_id !== "string") fail("GitHub repository ID is unavailable.");
  const initial = await readRemoteState(connectors);
  const local = snapshotLocalFiles();
  const diff = buildDiff(local, websiteEntries(initial.entries));
  const currentPlan = planHash(initial.commitSha, local);

  console.log(`GitHub ${BRANCH}: ${initial.commitSha}`);
  console.log(`Approved scope: ${WEBSITE_ROOT}/`);
  console.log(`Release plan: ${currentPlan}`);
  if (!diff.length) {
    console.log("No website changes to release.");
    return;
  }
  for (const entry of diff) console.log(`${entry.status}  ${entry.path}  ${entry.sha ?? "-"}`);
  console.log(`Local website snapshot: ${local.size} files`);

  if (!publish) {
    console.log(
      `Dry run only. Release with --publish --plan ${currentPlan} --message "Release description".`,
    );
    return;
  }
  if (approvedPlan !== currentPlan) {
    fail("The remote head or local website snapshot differs from the approved release plan.");
  }

  verifySnapshot(local);
  const treeEntries = await createBlobs(connectors, diff, local);
  verifySnapshot(local);

  const tree = await github(connectors, "/git/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: initial.treeSha, tree: treeEntries }),
  });
  const candidateTree = await github(connectors, `/git/trees/${tree.sha}?recursive=1`);
  if (candidateTree.truncated) fail("Candidate GitHub tree is truncated; refusing to continue.");
  const candidateWebsite = websiteEntries(candidateTree.tree);
  if (buildDiff(local, candidateWebsite).length) {
    fail("Candidate GitHub website tree does not match the verified local snapshot.");
  }

  const latest = await readRemoteState(connectors);
  if (latest.commitSha !== initial.commitSha) {
    fail(`GitHub ${BRANCH} moved during release; rerun from the new head.`);
  }

  const commit = await github(connectors, "/git/commits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [initial.commitSha],
    }),
  });

  await githubGraphql(
    connectors,
    `mutation UpdateRefs($input: UpdateRefsInput!) {
      updateRefs(input: $input) { clientMutationId }
    }`,
    {
      input: {
        repositoryId: repository.node_id,
        refUpdates: [
          {
            name: `refs/heads/${BRANCH}`,
            beforeOid: initial.commitSha,
            afterOid: commit.sha,
            force: false,
          },
        ],
      },
    },
  );

  const released = await readRemoteState(connectors);
  if (released.commitSha !== commit.sha) fail("GitHub main did not retain the release commit.");
  if (buildDiff(local, websiteEntries(released.entries)).length) {
    fail("Released GitHub website tree does not match the verified local snapshot.");
  }
  console.log(`Released ${commit.sha} to GitHub ${BRANCH} (non-force).`);
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(`Release refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}