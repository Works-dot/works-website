#!/usr/bin/env node

// A deliberately narrow multi-artifact release. This is NOT a mirror of the
// workspace: CMS uploads, generated files and local development state stay out.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { buildDiff, gitBlobSha } from "./release-website.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const REPO = "Works-dot/works-website";
const BRANCH = "main";
const ROOT_FILES = new Set([
  ".gitignore", "nixpacks.toml", "package.json", "pnpm-lock.yaml",
  "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json",
]);
const ARTIFACT_FILES = new Set([
  "package.json", "railway.json", "tsconfig.json", "vite.config.ts",
  "index.html", "components.json", "requirements.yaml", "server.mjs",
  "server-error.mjs", "server-health.mjs", "contact-server.mjs",
  "newsletter-server.mjs", "legacy-redirects.mjs", "legal-redirects.mjs",
  "build.mjs", "build.ts",
]);
const STRAPI_FILES = new Set([
  ".gitignore", "package.json", "railway.json", "tsconfig.json",
  "public/opengraph.jpg",
]);
const IMPORTED_ASSETS = new Set([
  "New_logo_1773998946128.png", "works-background_1774441334981.png",
  "bg_graphic_1774009634501.png", "bg_graphic2_1774011568340.png",
  "Purposeful_1774354143676.png", "contact-bg_1774518452836.png",
  "Frame_26081029_1774516588825.png", "homepage_graphic_1773999340930.png",
]);

export function inReleaseScope(path) {
  if (/(^|\/)(?:\.env(?:\.|$)|[^/]*\.(?:pem|key|p12|sqlite|db)|id_rsa)(?:\/|$)/i.test(path)) {
    return false;
  }
  if (ROOT_FILES.has(path)) return true;
  if (path.startsWith("attached_assets/")) {
    return IMPORTED_ASSETS.has(path.slice("attached_assets/".length));
  }
  if (path.startsWith("lib/")) {
    return !/(^|\/)(node_modules|dist|\.env(?:\.|$)|\.tmp)(\/|$)/.test(path);
  }
  const match = /^artifacts\/(works-website|api-server|strapi)\/(.+)$/.exec(path);
  if (!match) return false;
  const [, artifact, relative] = match;
  if (artifact === "strapi") {
    if (relative === "scripts/generate-legacy-blog-hu.mjs" ||
        relative === "translation/review-required.md") return false;
    return STRAPI_FILES.has(relative) ||
      /^(config|src|scripts|translation|types|database)\//.test(relative);
  }
  if (/(^|\/)(node_modules|dist|\.replit-artifact|\.env(?:\.|$)|\.tmp)(\/|$)/.test(relative)) {
    return false;
  }
  return ARTIFACT_FILES.has(relative) ||
    /^(src|scripts|public)\//.test(relative);
}

function fail(message) { throw new Error(message); }

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
}

export function snapshotFiles(workspaceRoot = ROOT) {
  const output = execFileSync("git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: workspaceRoot, encoding: "utf8" });
  const files = new Map();
  for (const path of output.split("\0").filter(inReleaseScope).sort()) {
    let stat;
    try { stat = lstatSync(resolve(workspaceRoot, path)); }
    catch (error) {
      if (error?.code === "ENOENT") continue; // tracked deletion
      throw error;
    }
    if (!stat.isFile()) fail(`Only regular files may be released: ${path}`);
    const content = readFileSync(resolve(workspaceRoot, path));
    files.set(path, {
      sha: gitBlobSha(content),
      mode: stat.mode & 0o111 ? "100755" : "100644",
    });
  }
  return files;
}

export function scopedEntries(entries) {
  const files = new Map();
  for (const entry of entries) {
    if (!inReleaseScope(entry.path)) continue;
    if (entry.type === "tree") continue;
    if (entry.type !== "blob" || !["100644", "100755"].includes(entry.mode)) {
      fail(`Unsupported Git object in release scope: ${entry.path}`);
    }
    files.set(entry.path, { sha: entry.sha, mode: entry.mode });
  }
  return files;
}

export function approvalHash(head, snapshot, diff) {
  return createHash("sha256").update(JSON.stringify({
    head,
    scope: "multi-artifact-v1",
    files: [...snapshot].map(([path, value]) => [path, value.sha, value.mode]),
    changes: diff.map(({ path, status, sha, mode }) => [path, status, sha, mode]),
  })).digest("hex");
}

export function assertUnrelatedUnchanged(before, after) {
  const baseline = new Map(before.filter(({ type, path }) => type !== "tree" && !inReleaseScope(path))
    .map(({ path, sha, mode, type }) => [path, { sha, mode, type }]));
  const candidate = new Map(after.filter(({ type, path }) => type !== "tree" && !inReleaseScope(path))
    .map(({ path, sha, mode, type }) => [path, { sha, mode, type }]));
  if (baseline.size !== candidate.size) fail("Candidate changed files outside release scope.");
  for (const [path, entry] of baseline) {
    if (JSON.stringify(candidate.get(path)) !== JSON.stringify(entry)) {
      fail(`Candidate changed an unrelated remote file: ${path}`);
    }
  }
}

async function request(client, path, options = {}) {
  const response = await client.proxy("github", `/repos/${REPO}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) fail(`GitHub ${response.status}: ${body?.message ?? "request failed"}`);
  return body;
}

async function remote(client) {
  const ref = await request(client, `/git/ref/heads/${BRANCH}`);
  const commit = await request(client, `/git/commits/${ref.object.sha}`);
  const tree = await request(client, `/git/trees/${commit.tree.sha}?recursive=1`);
  if (tree.truncated) fail("GitHub returned a truncated tree.");
  return { head: ref.object.sha, treeSha: commit.tree.sha, entries: tree.tree };
}

function assertSnapshot(expected) {
  const actual = snapshotFiles();
  if (buildDiff(actual, expected).length) fail("Local release files changed; rerun dry run.");
}

async function main() {
  const args = process.argv.slice(2);
  let publish = false;
  let dryRun = false;
  let plan = "";
  let message = "";
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--publish") publish = true;
    else if (argument === "--dry-run") dryRun = true;
    else if (argument === "--plan" || argument === "--message") {
      if (!args[index + 1] || args[index + 1].startsWith("--")) {
        fail(`${argument} needs a value.`);
      }
      if (argument === "--plan") plan = args[++index];
      else message = args[++index];
    } else fail(`Unknown argument: ${argument}`);
  }
  if (publish && dryRun) fail("Choose either --dry-run or --publish.");
  if (publish && (!/^[a-f0-9]{64}$/.test(plan ?? "") || !message?.trim())) {
    fail('Publishing requires --plan HASH and --message "Release description".');
  }
  if (git(["diff", "--name-only", "--diff-filter=U"]).trim()) fail("Resolve conflicts first.");
  const client = new ReplitConnectors();
  const repo = await request(client, "");
  if (!repo.node_id) fail("Repository ID unavailable.");
  const base = await remote(client);
  const local = snapshotFiles();
  const diff = buildDiff(local, scopedEntries(base.entries));
  const hash = approvalHash(base.head, local, diff);
  console.log(`GitHub ${BRANCH}: ${base.head}`);
  console.log("Scope: website, API, Strapi code/translations, lib and build manifests; no CMS uploads.");
  console.log(`Plan: ${hash}`);
  for (const item of diff) console.log(`${item.status}  ${item.path}  ${item.sha ?? "-"}`);
  if (!diff.length) { console.log("No approved changes."); return; }
  if (!publish) { console.log("Dry run only; no GitHub writes."); return; }
  if (plan !== hash) fail("Head or release snapshot changed since approval.");

  assertSnapshot(local);
  const updates = [];
  for (const item of diff) {
    if (item.status === "D") {
      updates.push({ path: item.path, type: "blob", mode: item.mode, sha: null });
      continue;
    }
    const content = readFileSync(resolve(ROOT, item.path));
    if (gitBlobSha(content) !== item.sha) fail(`Changed during upload: ${item.path}`);
    const blob = await request(client, "/git/blobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
    });
    if (blob.sha !== item.sha) fail(`Blob verification failed: ${item.path}`);
    updates.push({ path: item.path, type: "blob", mode: item.mode, sha: blob.sha });
  }
  assertSnapshot(local);
  const tree = await request(client, "/git/trees", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base_tree: base.treeSha, tree: updates }),
  });
  const candidate = await request(client, `/git/trees/${tree.sha}?recursive=1`);
  if (candidate.truncated) fail("Candidate tree truncated.");
  if (buildDiff(local, scopedEntries(candidate.tree)).length) fail("Candidate scoped tree mismatch.");
  assertUnrelatedUnchanged(base.entries, candidate.tree);
  assertSnapshot(local);
  if ((await remote(client)).head !== base.head) fail("Remote head moved; rerun dry run.");
  const commit = await request(client, "/git/commits", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, tree: tree.sha, parents: [base.head] }),
  });
  const response = await client.proxy("github", "/graphql", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "mutation($input:UpdateRefsInput!){updateRefs(input:$input){clientMutationId}}",
      variables: { input: { repositoryId: repo.node_id, refUpdates: [{
        name: `refs/heads/${BRANCH}`, beforeOid: base.head, afterOid: commit.sha, force: false,
      }] } },
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.errors?.length) {
    fail(`Atomic ref update refused: ${result?.errors?.[0]?.message ?? response.status}`);
  }
  const released = await remote(client);
  if (released.head !== commit.sha ||
      buildDiff(local, scopedEntries(released.entries)).length) {
    fail("Remote release verification failed.");
  }
  assertUnrelatedUnchanged(base.entries, released.entries);
  console.log(`Released ${commit.sha}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Release refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}