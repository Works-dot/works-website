import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/public");
async function files(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(name));
    else result.push(name);
  }
  return result;
}
const all = await files(root);
const failures = [];
let images = 0;
const variants = new Set();
for (const filename of all.filter(name => name.endsWith(".html"))) {
  const html = await fs.readFile(filename, "utf8");
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    images++;
    const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1].toLowerCase(), m[2]]));
    if (!(Number(attrs.width) > 0 && Number(attrs.height) > 0)) failures.push(`${path.relative(root, filename)}: dimensions missing ${attrs.src}`);
    if (!["eager", "lazy"].includes(attrs.loading)) failures.push(`${filename}: loading missing ${attrs.src}`);
    if (attrs.srcset) {
      if (!attrs.sizes) failures.push(`${filename}: sizes missing ${attrs.src}`);
      for (const candidate of attrs.srcset.split(", ")) {
        const [url, width] = candidate.split(" ");
        if (!/^[1-9]\d*w$/.test(width)) failures.push(`Invalid width ${candidate}`);
        if (url.startsWith("/media/")) variants.add(url);
      }
    }
  }
}
for (const url of variants) {
  try { await fs.access(path.join(root, url)); } catch { failures.push(`Missing build asset ${url}`); }
}
const mediaFiles = all.filter(name => name.includes(`${path.sep}media${path.sep}`));
let bytes = 0;
for (const filename of mediaFiles) bytes += (await fs.stat(filename)).size;
console.log(JSON.stringify({ pages: all.filter(f => f.endsWith(".html")).length, images, referencedVariants: variants.size, mediaFiles: mediaFiles.length, mediaMiB: +(bytes / 1024 / 1024).toFixed(2), failures }, null, 2));
assert.equal(failures.length, 0, "Responsive image HTML/build audit failed");
