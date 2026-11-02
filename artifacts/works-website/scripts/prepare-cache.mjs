import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const MAX_BYTES = 250 * 1024 * 1024;
const assetPattern = /\.(?:js|mjs|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf)$/i;
export const safeAssetUrl = url => typeof url === "string" &&
  /^\/(?:assets|media|static)\//.test(url) &&
  !url.includes("\\") && !url.includes("%") && !url.split("/").includes("..") &&
  assetPattern.test(url);

async function walk(dir, prefix = "") {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) result.push(...await walk(path.join(dir, entry.name), `${name}/`));
    else if (entry.isFile()) result.push(name);
  }
  return result;
}

async function download(url, limit, fetcher) {
  const response = await fetcher(url, { redirect: "error", signal: AbortSignal.timeout(30000) });
  if (response.status === 404) return null;
  if (!response.ok) throw Error(`Previous release unavailable: HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw Error("Previous release exceeds byte limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function prepareCache({ distDir, previousOrigin, fetcher = fetch, now = Date.now() }) {
  const assets = [];
  const redirects = {};
  const files = await walk(distDir);
  for (const relative of files) {
    if (!assetPattern.test(relative)) continue;
    const bytes = await fs.readFile(path.join(distDir, relative));
    const sha256 = digest(bytes);
    let url = `/${relative}`;
    // Vite assets and generated media already have content-dependent names.
    // Unversioned public files get a content-addressed copy and redirect.
    const versioned = /^static\/[a-f0-9]{64}\/[^/]+$/.test(relative) ||
      /^assets\/.+-[\w-]{8,}\.[^.]+$/.test(relative) ||
      /^media\/og\/[a-f0-9]{64}\.[^.]+$/.test(relative) ||
      /^media\/.+-[a-f0-9]{16,}(?:-\d+)?\.[^.]+$/.test(relative);
    if (!versioned) {
      url = `/static/${sha256}/${path.basename(relative)}`;
      await fs.mkdir(path.dirname(path.join(distDir, url)), { recursive: true });
      await fs.writeFile(path.join(distDir, url), bytes);
      redirects[`/${relative}`] = url;
    }
    assets.push({ url, sha256, bytes: bytes.length });
  }
  if (previousOrigin) {
    const origin = new URL(previousOrigin);
    if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.username || origin.password)
      throw Error("Previous release must be an HTTPS origin");
    const data = await download(new URL("/asset-cache.json", origin), 4 * 1024 * 1024, fetcher);
    // The first rollout predates cache-enabled HTML. Subsequent failures must
    // fail the build rather than silently deleting a cached page's resources.
    if (!data) {
      const homepage = await fetcher(origin, { method: "HEAD", redirect: "error", signal: AbortSignal.timeout(30000) });
      if (!homepage.ok || !/\bno-cache\b|\bno-store\b/.test(homepage.headers.get("cache-control") || ""))
        throw Error("Missing previous manifest on a cache-enabled release; refusing unsafe bootstrap");
    } else {
      const previous = JSON.parse(data);
      if (previous.version !== 1 || !Array.isArray(previous.assets) || previous.assets.length > 15000)
        throw Error("Invalid previous asset manifest");
      const current = new Set(assets.map(asset => asset.url));
      let total = 0;
      for (const asset of previous.assets) {
        if (!safeAssetUrl(asset.url) || !/^[a-f0-9]{64}$/.test(asset.sha256) ||
            !Number.isSafeInteger(asset.bytes) || asset.bytes < 0)
          throw Error("Unsafe previous asset entry");
        if (current.has(asset.url) || (asset.retainUntil && asset.retainUntil < now)) continue;
        total += asset.bytes;
        if (total > MAX_BYTES) throw Error("Previous assets exceed retention budget");
        const bytes = await download(new URL(asset.url, origin), Math.min(asset.bytes + 1, MAX_BYTES), fetcher);
        if (!bytes || bytes.length !== asset.bytes || digest(bytes) !== asset.sha256)
          throw Error(`Previous asset integrity check failed: ${asset.url}`);
        await fs.mkdir(path.dirname(path.join(distDir, asset.url)), { recursive: true });
        await fs.writeFile(path.join(distDir, asset.url), bytes);
        assets.push({ ...asset, retainUntil: asset.retainUntil || now + 24 * 60 * 60 * 1000 });
        current.add(asset.url);
      }
    }
  }
  const manifest = { version: 1, generatedAt: new Date(now).toISOString(), assets, redirects };
  await fs.writeFile(path.join(distDir, "asset-cache.json"), JSON.stringify(manifest));
  console.log(`Cache manifest: ${assets.length} assets, ${Object.keys(redirects).length} versioned public URLs.`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareCache({
    distDir: path.join(root, "dist/public"),
    // Explicit production origin, verified from the Railway service domains.
    // Local builds never depend on production networking.
    previousOrigin: process.env.RAILWAY_ENVIRONMENT_ID ? "https://www.worksdot.hu" : undefined,
  });
}
