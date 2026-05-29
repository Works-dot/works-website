import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const strapiRoot = path.resolve(__dirname, "..");
const uploadsDir = path.join(strapiRoot, "public", "uploads");
const seedDir = path.join(strapiRoot, "public", "uploads-seed");

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f !== ".gitkeep");
  } catch {
    return [];
  }
}

if (!fs.existsSync(seedDir)) {
  console.log("[seed-uploads] No seed snapshot found — skipping.");
  process.exit(0);
}

fs.mkdirSync(uploadsDir, { recursive: true });

const seedFiles = listFiles(seedDir);
console.log(`[seed-uploads] Seed snapshot has ${seedFiles.length} file(s).`);
console.log(`[seed-uploads] Uploads volume currently has ${listFiles(uploadsDir).length} file(s).`);

let copied = 0;
for (const name of seedFiles) {
  const dest = path.join(uploadsDir, name);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(path.join(seedDir, name), dest);
    copied += 1;
  }
}

console.log(
  `[seed-uploads] Synced ${copied} missing file(s). Uploads volume now has ${listFiles(uploadsDir).length} file(s).`,
);
