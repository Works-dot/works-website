import fs from "node:fs";
import path from "node:path";

export const HTML_CACHE = "public, max-age=60, stale-while-revalidate=300";
export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

// Only files verified by the build may be immutable. A directory name is not
// evidence that its contents have versioned URLs.
export function readCacheManifest(distDir) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(distDir, "asset-cache.json"), "utf8"));
    if (manifest.version !== 1 || !Array.isArray(manifest.assets)) throw Error("Invalid cache manifest");
    return manifest;
  } catch (error) {
    if (error.code === "ENOENT") return { assets: [], redirects: {} };
    throw error;
  }
}

export function staticCachePolicy(file, root, manifest) {
  const url = "/" + path.relative(root, file).split(path.sep).join("/");
  if (url === "/asset-cache.json" || url === "/404.html") return "no-store";
  if (manifest.assets.some(asset => asset.url === url)) return IMMUTABLE_CACHE;
  if (file.endsWith(".html")) return manifest.version === 1 ? HTML_CACHE : "no-cache";
  return "no-cache";
}
