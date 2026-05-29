import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const strapiRoot = path.resolve(__dirname, "..");
const uploadsDir = path.join(strapiRoot, "public", "uploads");
const seedDir = path.join(strapiRoot, "public", "uploads-seed");

function entryCount(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f !== ".gitkeep").length;
  } catch {
    return 0;
  }
}

if (!fs.existsSync(seedDir)) {
  console.log("[seed-uploads] No seed snapshot found — skipping.");
  process.exit(0);
}

fs.mkdirSync(uploadsDir, { recursive: true });

if (entryCount(uploadsDir) > 0) {
  console.log("[seed-uploads] Uploads volume already populated — skipping seed.");
  process.exit(0);
}

console.log("[seed-uploads] Uploads volume is empty — seeding from baked snapshot...");
fs.cpSync(seedDir, uploadsDir, { recursive: true });
console.log(`[seed-uploads] Seeded ${entryCount(uploadsDir)} file(s) into ${uploadsDir}`);
