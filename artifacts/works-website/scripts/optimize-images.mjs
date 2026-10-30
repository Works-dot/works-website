import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { loadOgSource } from "./generate-og-images.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const cachePath = path.join(root, "src", "data", "strapi-cache.json");
const cmsUploadsDir = process.env.STRAPI_UPLOADS_DIR
  ? path.resolve(process.env.STRAPI_UPLOADS_DIR)
  : path.resolve(root, "..", "strapi", "public", "uploads");
const mediaDir = path.join(root, "public", "media");
const manifestPath = path.join(root, "src", "data", "image-manifest.ts");

const WIDTHS = [64, 128, 192, 320, 480, 768, 1200, 1600, 1920];
const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export function hashSourceTransform(source, width, bytes = "") {
  return createHash("sha256").update(`${source}\0${width}\0rotate-webp85-v2\0`).update(bytes).digest("hex").slice(0, 20);
}

function normalizeSource(source) {
  return source.split(/[?#]/, 1)[0];
}

export function safeName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export function isRasterSource(source) {
  return RASTER_EXTENSIONS.has(path.extname(source).toLowerCase());
}

export function getVariantWidths(intrinsicWidth) {
  const widths = WIDTHS.filter((width) => width < intrinsicWidth);
  widths.push(intrinsicWidth);
  return [...new Set(widths)].sort((a, b) => a - b);
}

function collectStrings(value, output) {
  if (typeof value === "string") {
    const source = normalizeSource(value);
    if (source.startsWith("/strapi/uploads/")) output.add(source);
    if (/^https?:\/\//.test(source) && process.env.STRAPI_URL) {
      const url = new URL(source);
      if (url.origin === new URL(process.env.STRAPI_URL).origin && /^\/(?:strapi\/)?uploads\//.test(url.pathname)) output.add(source);
    }
    for (const match of value.matchAll(/\/strapi\/uploads\/[^\s"'()<>]+\.(?:png|jpe?g|webp|gif|svg)/gi)) output.add(match[0]);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
}

async function collectLocalAssets(directory, relative = "") {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT" && relative === "") return [];
    throw error;
  }
  const assets = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      assets.push(...(await collectLocalAssets(absolute, nextRelative)));
    } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(entry.name)) {
      assets.push({ absolute, relative: nextRelative.split(path.sep).join("/") });
    }
  }
  return assets;
}

async function collectAttachedImports(directory, result = new Set()) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await collectAttachedImports(filename, result);
    else if (/\.[jt]sx?$/.test(entry.name)) {
      const text = await fs.readFile(filename, "utf8");
      for (const match of text.matchAll(/["']@assets\/([^"']+\.(?:png|jpe?g|webp|svg|gif))["']/gi)) result.add(match[1]);
    }
  }
  return result;
}

export async function renderVariant(bytes, width) {
  return sharp(bytes, { limitInputPixels: 50_000_000 }).rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 }).toBuffer();
}

async function writeVariants({
  absolute,
  bytes,
  source,
  key,
  outputSubdirectory,
  manifest,
  cmsManifest,
}) {
  bytes ??= await fs.readFile(absolute);
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for image: ${absolute}`);
  }
  const swapped = [5, 6, 7, 8].includes(metadata.orientation);
  const intrinsicWidth = swapped ? metadata.height : metadata.width;
  const intrinsicHeight = swapped ? metadata.width : (metadata.pageHeight || metadata.height);
  // Preserve SVG and animation bytes; still record their intrinsic dimensions.
  if (!isRasterSource(source) || (metadata.pages && metadata.pages > 1)) {
    manifest[key] = { source, src: source, srcSet: "", width: intrinsicWidth, height: intrinsicHeight };
    return false;
  }

  const extension = path.extname(source);
  const baseName = safeName(path.basename(source, extension));
  const outputDirectory = path.join(mediaDir, outputSubdirectory);
  await fs.mkdir(outputDirectory, { recursive: true });

  const uniqueWidths = getVariantWidths(intrinsicWidth);
  const variants = [];

  for (const width of uniqueWidths) {
    const hash = hashSourceTransform(source, width, bytes);
    const outputName = `${baseName}-${hash}-${width}.webp`;
    const outputPath = path.join(outputDirectory, outputName);
    try { await fs.access(outputPath); }
    catch { await fs.writeFile(outputPath, await renderVariant(bytes, width)); }
    variants.push({
      hash,
      width,
      url: `/media/${outputSubdirectory}/${outputName}`,
    });
  }

  const largest = variants[variants.length - 1];
  if (manifest) {
    manifest[key] = {
      source,
      src: largest.url,
      srcSet: variants.map((variant) => `${variant.url} ${variant.width}w`).join(", "),
      width: intrinsicWidth,
      height: intrinsicHeight,
    };
  }
  if (cmsManifest) {
    cmsManifest[key] = variants.map((variant) => [variant.hash, variant.width]);
  }
  return true;
}

async function main() {
  let cache = {};
  try {
    cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.warn(`CMS cache is unavailable; keeping original CMS image URLs: ${cachePath}`);
  }
  const cmsSources = new Set();
  collectStrings(cache, cmsSources);

  const localAssetDirectory = path.join(root, "src", "assets");
  const localAssets = await collectLocalAssets(localAssetDirectory);
  for (const relative of await collectAttachedImports(path.join(root, "src"))) {
    localAssets.push({ absolute: path.resolve(root, "../../attached_assets", relative), relative });
  }
  // Do not delete OG outputs or assets still referenced by another build.
  await fs.mkdir(mediaDir, { recursive: true });

  const manifest = {};
  const cmsManifest = {};
  let generated = 0;

  for (const source of [...cmsSources].sort()) {
    const filename = path.basename(source);
    if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(filename)) continue;
    const bytes = await loadOgSource(source, { uploadsDir: cmsUploadsDir });
    const created = await writeVariants({
      bytes,
      source,
      key: source,
      outputSubdirectory: "uploads",
      manifest,
      cmsManifest,
    });
    if (created) generated++;
  }

  for (const asset of localAssets.sort((a, b) => a.relative.localeCompare(b.relative))) {
    const source = `/assets/${asset.relative}`;
    const created = await writeVariants({
      absolute: asset.absolute,
      source,
      key: `local:${asset.relative}`,
      outputSubdirectory: "local",
      manifest,
      cmsManifest: null,
    });
    if (created) generated++;
  }

  const manifestSource = [
    "/* Generated by scripts/optimize-images.mjs. Do not edit by hand. */",
    'import type { OptimizedImageManifestEntry } from "./image-manifest-types";',
    "",
    `const imageManifest: Record<string, OptimizedImageManifestEntry> = ${JSON.stringify(manifest, null, 2)};`,
    "",
    `export const optimizedCmsImageVariants: Record<string, Array<[string, number]>> = ${JSON.stringify(cmsManifest, null, 2)};`,
    "",
    "export default imageManifest;",
    "",
  ].join("\n");
  await fs.writeFile(manifestPath, manifestSource);
  const used = new Set(Object.values(manifest).flatMap(entry =>
    entry.srcSet.split(", ").filter(Boolean).map(candidate => path.basename(candidate.split(" ")[0]))));
  for (const subdir of ["uploads", "local"]) {
    const directory = path.join(mediaDir, subdir);
    for (const filename of await fs.readdir(directory).catch(() => [])) {
      if (!used.has(filename)) await fs.unlink(path.join(directory, filename));
    }
  }
  console.log(`Generated WebP variants for ${generated} source images.`);
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error(`Image optimization failed: ${error.message}`);
    process.exitCode = 1;
  });
}