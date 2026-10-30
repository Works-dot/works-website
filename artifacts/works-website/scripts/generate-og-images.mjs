import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FALLBACK = "/opengraph.jpg";
const MAX_BYTES = 25 * 1024 * 1024;
export function ogFilename(bytes) {
  return createHash("sha256").update("og-v1:rotate:center:1200x630:white:jpeg90\0").update(bytes).digest("hex") + ".jpg";
}
export async function renderOg(bytes) {
  return sharp(bytes, { limitInputPixels: 50_000_000, page: 0 })
    .rotate().resize(1200, 630, { fit: "cover", position: "centre" })
    .flatten({ background: "#ffffff" }).toColourspace("srgb")
    .jpeg({ quality: 90 }).toBuffer();
}
export async function loadOgSource(source, { cmsOrigin = process.env.STRAPI_URL, uploadsDir = process.env.STRAPI_UPLOADS_DIR || path.resolve(root, "../strapi/public/uploads"), publicDir = path.join(root, "public"), fetcher = fetch } = {}) {
  if (source === FALLBACK) return fs.readFile(path.join(publicDir, "opengraph.jpg"));
  const isCms = source.startsWith("/strapi/uploads/");
  if (isCms && !cmsOrigin) {
    const filename = decodeURIComponent(source.slice("/strapi/uploads/".length));
    if (!filename || filename.includes("/") || filename.includes("\\") || filename === "..") throw Error("Unsafe CMS media path");
    return fs.readFile(path.join(uploadsDir, filename));
  }
  if (!cmsOrigin) throw Error("Remote OG media requires STRAPI_URL");
  const origin = new URL(cmsOrigin);
  const url = new URL(source, origin);
  if ((!isCms && !/^https?:\/\//.test(source)) || url.origin !== origin.origin ||
      !url.pathname.startsWith("/strapi/uploads/") && !url.pathname.startsWith("/uploads/") ||
      url.username || url.password) throw Error("OG media must belong to the configured CMS uploads origin");
  // Never use the repository snapshot when a live CMS is configured.
  const response = await fetcher(url, { redirect: "error", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error(`OG source returned HTTP ${response.status}`);
  if (Number(response.headers.get("content-length")) > MAX_BYTES) throw Error("OG source exceeds 25 MiB");
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    if (length > MAX_BYTES) throw Error("OG source exceeds 25 MiB");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export async function generateOgImages() {
  const cache = JSON.parse(await fs.readFile(path.join(root, "src/data/strapi-cache.json"), "utf8"));
  const sources = new Set([FALLBACK]);
  for (const locale of ["hu", "en"]) {
    for (const record of [...(cache[locale]?.projects || []), ...(cache[locale]?.blogPosts || [])]) {
      if (record.image) sources.add(record.image);
    }
  }
  const output = path.join(root, "public/media/og");
  await fs.mkdir(output, { recursive: true });
  const manifest = {};
  for (const source of [...sources].sort()) {
    try {
      const bytes = await loadOgSource(source);
      if (bytes.length > MAX_BYTES) throw Error("OG source exceeds 25 MiB");
      const filename = ogFilename(bytes);
      const target = path.join(output, filename);
      try { await fs.access(target); } catch { await fs.writeFile(target, await renderOg(bytes)); }
      const metadata = await sharp(target).metadata();
      if (metadata.width !== 1200 || metadata.height !== 630 || metadata.format !== "jpeg") throw Error("Invalid generated OG dimensions");
      manifest[source] = { url: `/media/og/${filename}`, width: 1200, height: 630 };
    } catch (error) {
      throw Error(`OG generation failed for ${source.split("?")[0]}: ${error.message}`);
    }
  }
  const manifestPath = path.join(root, "src/data/og-image-manifest.json");
  const content = JSON.stringify(manifest, null, 2) + "\n";
  const previous = await fs.readFile(manifestPath, "utf8").catch(() => "");
  if (previous !== content) await fs.writeFile(manifestPath, content);
  console.log(`OG images ready: ${sources.size} sources, 1200×630 JPEG.`);
}
