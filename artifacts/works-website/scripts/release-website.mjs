#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
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
  let filesManifest = "";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--publish") publish = true;
    else if (argument === "--dry-run") publish = false;
    else if (["--message", "--plan", "--files-manifest"].includes(argument)) {
      const value = argv[++index];
      if (!value || value.startsWith("--")) fail(`${argument} requires a value.`);
      if (argument === "--message") message = value;
      else if (argument === "--plan") approvedPlan = value;
      else filesManifest = value;
    }
    else fail(`Unknown argument: ${argument}`);
  }
  if (publish && !message.trim()) {
    fail("Publishing requires --message \"Release description\".");
  }
  if (publish && !/^[a-f0-9]{64}$/.test(approvedPlan)) {
    fail("Publishing requires the exact --plan hash printed by the approved dry run.");
  }
  return { publish, message: message.trim(), approvedPlan, filesManifest };
}

function safeWorkspacePath(workspaceRoot, path) {
  if (typeof path !== "string" || !path || isAbsolute(path) ||
      path.includes("\\") || path.split("/").some((part) => !part || part === "." || part === "..")) {
    fail(`Invalid workspace-relative path: ${String(path)}`);
  }
  const root = resolve(workspaceRoot);
  const absolute = resolve(root, path);
  const inside = relative(root, absolute);
  if (!inside || inside.startsWith(`..${sep}`) || inside === ".." || isAbsolute(inside)) {
    fail(`Path escapes workspace: ${path}`);
  }
  let parent = dirname(absolute);
  while (parent !== root) {
    let stat;
    try {
      stat = lstatSync(parent);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (stat && !stat.isDirectory()) fail(`Symlink or non-directory ancestor: ${path}`);
    parent = dirname(parent);
  }
  return absolute;
}

export function readFilesManifest(manifestPath, workspaceRoot = WORKSPACE_ROOT) {
  const absolute = safeWorkspacePath(workspaceRoot, manifestPath);
  if (!lstatSync(absolute).isFile()) fail(`Manifest must be a regular file: ${manifestPath}`);
  let paths;
  try {
    paths = JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    fail(`Invalid files manifest JSON: ${error.message}`);
  }
  if (!Array.isArray(paths) || !paths.length) fail("Files manifest must be a nonempty JSON array.");
  const selected = new Set();
  for (const path of paths) {
    if (typeof path !== "string" ||
        !(path.startsWith("artifacts/works-website/") || path.startsWith("artifacts/strapi/")) ||
        (path.startsWith("artifacts/strapi/public/uploads/") ||
          path === "artifacts/strapi/public/uploads")) {
      fail(`File outside approved release scope: ${String(path)}`);
    }
    safeWorkspacePath(workspaceRoot, path);
    if (selected.has(path)) fail(`Duplicate file in manifest: ${path}`);
    selected.add(path);
  }
  return [...selected].sort();
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
  selectedPaths,
} = {}) {
  const snapshot = new Map();
  const paths = selectedPaths ?? listLocalFiles(workspaceRoot, websiteRoot);
  for (const path of paths) {
    if (selectedPaths) {
      // A missing file is a deletion only if it was explicitly named AND tracked.
      const tracked = git(["ls-files", "-z", "--cached", "--", path], workspaceRoot)
        .split("\0").includes(path);
      const absolute = safeWorkspacePath(workspaceRoot, path);
      if (!tracked) {
        try {
          lstatSync(absolute);
        } catch (error) {
          if (error?.code === "ENOENT") fail(`Missing untracked selected file: ${path}`);
          throw error;
        }
      }
    } else if (!path.startsWith(`${websiteRoot}/`)) fail(`Out-of-scope path: ${path}`);
    const absolutePath = safeWorkspacePath(workspaceRoot, path);
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

function verifySnapshot(expected, selectedPaths) {
  const current = snapshotLocalFiles({ selectedPaths });
  if (current.size !== expected.size) fail("Release files changed after release planning; rerun.");
  for (const [path, metadata] of expected) {
    const actual = current.get(path);
    if (!actual || actual.sha !== metadata.sha || actual.mode !== metadata.mode) {
      fail(`Release file changed after release planning: ${path}`);
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

export function selectedEntries(entries, selectedPaths) {
  const selected = new Set(selectedPaths);
  const scoped = new Map();
  for (const entry of entries) {
    if (!selected.has(entry.path)) continue;
    if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      fail(`Unsupported Git object in selected scope: ${entry.path}`);
    }
    scoped.set(entry.path, { sha: entry.sha, mode: entry.mode });
  }
  return scoped;
}

export function assertUnselectedUnchanged(before, after, selectedPaths) {
  const selected = new Set(selectedPaths ?? []);
  const files = (entries) => new Map(entries
    .filter((entry) => entry.type !== "tree" && !selected.has(entry.path))
    .map(({ path, sha, mode, type }) => [path, { sha, mode, type }]));
  const initial = files(before);
  const candidate = files(after);
  if (initial.size !== candidate.size) fail("Tree changed files outside release selection.");
  for (const [path, entry] of initial) {
    if (JSON.stringify(candidate.get(path)) !== JSON.stringify(entry)) {
      fail(`Tree changed an unselected remote file: ${path}`);
    }
  }
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

export function planHash(remoteCommitSha, snapshot, selectedPaths) {
  const files = [...snapshot].map(([path, metadata]) => ({
    path,
    mode: metadata.mode,
    sha: metadata.sha,
  }));
  return createHash("sha256")
    .update(JSON.stringify(selectedPaths
      ? { remoteCommitSha, selectedPaths: [...selectedPaths].sort(), files }
      : { remoteCommitSha, files }))
    .digest("hex");
}

async function createBlobs(connectors, diff, snapshot) {
  const entries = [];
  for (const item of diff) {
    if (item.status === "D") {
      entries.push({ path: item.path, mode: item.mode, type: "blob", sha: null });
      continue;
    }
    const absolute = safeWorkspacePath(WORKSPACE_ROOT, item.path);
    if (!lstatSync(absolute).isFile()) fail(`Only regular files can be released: ${item.path}`);
    const content = readFileSync(absolute);
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
  const { publish, message, approvedPlan, filesManifest } = parseArgs(process.argv.slice(2));
  if (git(["diff", "--name-only", "--diff-filter=U"])) fail("Resolve merge conflicts first.");
  const selectedPaths = filesManifest ? readFilesManifest(filesManifest) : undefined;
  const remoteScope = (entries) => selectedPaths
    ? selectedEntries(entries, selectedPaths)
    : websiteEntries(entries);
  const verifySelection = () => {
    if (filesManifest &&
        JSON.stringify(readFilesManifest(filesManifest)) !== JSON.stringify(selectedPaths)) {
      fail("Files manifest changed after release planning; rerun.");
    }
  };

  const connectors = new ReplitConnectors();
  const repository = await github(connectors, "");
  if (typeof repository.node_id !== "string") fail("GitHub repository ID is unavailable.");
  const initial = await readRemoteState(connectors);
  const local = snapshotLocalFiles({ selectedPaths });
  const diff = buildDiff(local, remoteScope(initial.entries));
  const currentPlan = planHash(initial.commitSha, local, selectedPaths);

  console.log(`GitHub ${BRANCH}: ${initial.commitSha}`);
  console.log(selectedPaths
    ? `Approved scope: ${selectedPaths.length} exact file(s) from ${filesManifest}`
    : `Approved scope: ${WEBSITE_ROOT}/`);
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

  verifySelection();
  verifySnapshot(local, selectedPaths);
  const treeEntries = await createBlobs(connectors, diff, local);
  verifySelection();
  verifySnapshot(local, selectedPaths);

  const tree = await github(connectors, "/git/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: initial.treeSha, tree: treeEntries }),
  });
  const candidateTree = await github(connectors, `/git/trees/${tree.sha}?recursive=1`);
  if (candidateTree.truncated) fail("Candidate GitHub tree is truncated; refusing to continue.");
  const candidateWebsite = remoteScope(candidateTree.tree);
  if (buildDiff(local, candidateWebsite).length) {
    fail("Candidate GitHub tree does not match the verified local snapshot.");
  }
  assertUnselectedUnchanged(initial.entries, candidateTree.tree,
    selectedPaths ?? [...websiteEntries(initial.entries).keys(), ...local.keys()]);

  verifySelection();
  verifySnapshot(local, selectedPaths);
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
  if (buildDiff(local, remoteScope(released.entries)).length) {
    fail("Released GitHub tree does not match the verified local snapshot.");
  }
  assertUnselectedUnchanged(initial.entries, released.entries,
    selectedPaths ?? [...websiteEntries(initial.entries).keys(), ...local.keys()]);
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