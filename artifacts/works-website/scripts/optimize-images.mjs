import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const cachePath = path.join(root, "src", "data", "strapi-cache.json");
const cmsUploadsDir = process.env.STRAPI_UPLOADS_DIR
  ? path.resolve(process.env.STRAPI_UPLOADS_DIR)
  : path.resolve(root, "..", "strapi", "public", "uploads");
const mediaDir = path.join(root, "public", "media");
const manifestPath = path.join(root, "src", "data", "image-manifest.ts");

const WIDTHS = [320, 480, 768, 1200, 1600, 1920];
const RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export function hashSourceTransform(source, width) {
  const input = `${source}\0${width}\0webp80\0effort4`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
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
    } else if (isRasterSource(entry.name)) {
      assets.push({ absolute, relative: nextRelative.split(path.sep).join("/") });
    }
  }
  return assets;
}

async function writeVariants({
  absolute,
  source,
  key,
  outputSubdirectory,
  manifest,
  cmsManifest,
}) {
  const metadata = await sharp(absolute).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for image: ${absolute}`);
  }
  // Do not flatten animated WebP files while creating static width variants.
  if (metadata.pages && metadata.pages > 1) return false;

  const extension = path.extname(source);
  const baseName = safeName(path.basename(source, extension));
  const outputDirectory = path.join(mediaDir, outputSubdirectory);
  await fs.mkdir(outputDirectory, { recursive: true });

  const uniqueWidths = getVariantWidths(metadata.width);
  const variants = [];

  for (const width of uniqueWidths) {
    const hash = hashSourceTransform(source, width);
    const outputName = `${baseName}-${hash}-${width}.webp`;
    const outputPath = path.join(outputDirectory, outputName);
    await sharp(absolute)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(outputPath);
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
      width: metadata.width,
      height: metadata.height,
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
  const hasCmsUploads = await fs
    .access(cmsUploadsDir)
    .then(() => true)
    .catch(() => false);

  await fs.rm(mediaDir, { recursive: true, force: true });
  await fs.mkdir(mediaDir, { recursive: true });

  const manifest = {};
  const cmsManifest = {};
  let generated = 0;

  let skippedCms = 0;
  for (const source of [...cmsSources].sort()) {
    if (!hasCmsUploads) {
      skippedCms++;
      continue;
    }
    const filename = source.slice("/strapi/uploads/".length);
    const absolute = path.join(cmsUploadsDir, filename);
    if (!isRasterSource(filename)) continue;
    try {
      await fs.access(absolute);
    } catch {
      skippedCms++;
      continue;
    }
    const created = await writeVariants({
      absolute,
      source,
      key: source,
      outputSubdirectory: "uploads",
      manifest: null,
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
  if (skippedCms > 0) {
    console.warn(
      `Kept ${skippedCms} CMS image URL(s) unchanged because their local upload snapshot is unavailable.`,
    );
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