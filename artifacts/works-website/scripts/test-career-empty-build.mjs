// Offline regression: never fetches/writes CMS. Always restores the snapshot.
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const snapshot = new URL("src/data/strapi-cache.json", root);
const original = fs.readFileSync(snapshot);
const fixture = JSON.parse(original);
const locales = fixture.hu ? [fixture.hu, fixture.en].filter(Boolean) : [fixture];
for (const locale of locales) locale.positions = [];
try {
  fs.writeFileSync(snapshot, JSON.stringify(fixture, null, 2));
  const result = spawnSync("pnpm", ["exec", "vite", "build"], {
    cwd: fileURLToPath(root), stdio: "inherit", env: { ...process.env, VITE_STRAPI_ENABLED: "false" },
  });
  assert.equal(result.status, 0, "zero-job client build");
  const ssr = spawnSync("pnpm", ["exec", "vite", "build", "--ssr", "src/entry-server.tsx", "--outDir", "dist/server"], {
    cwd: fileURLToPath(root), stdio: "inherit", env: { ...process.env, VITE_STRAPI_ENABLED: "false" },
  });
  assert.equal(ssr.status, 0, "zero-job SSR build");
  const prerender = spawnSync("node", ["scripts/prerender.mjs"], { cwd: fileURLToPath(root), stdio: "inherit" });
  assert.equal(prerender.status, 0);
  const built = await import(new URL("dist/server/entry-server.js", root));
  for (const [locale, route, message] of [
    ["hu", "/karrier", "Jelenleg nincs aktív álláshirdetés."],
    ["en", "/en/careers", "There are currently no active job openings."],
  ]) {
    assert.deepEqual(built.getLocaleFallback("careerPositions", locale), []);
    assert.match(built.render(route).html, new RegExp(message.replace(".", "\\.")));
    assert.equal(built.getLocaleFallback("careerPosition:missing", locale), undefined);
    const missing = built.render(`${route}/missing`).html;
    assert.match(missing, locale === "hu" ? /Pozíció nem található/ : /Position not found/);
    assert.doesNotMatch(missing, /genuine-cms-position|Senior UX Researcher/);
  }
  const sitemap = fs.readFileSync(new URL("dist/public/sitemap.xml", root), "utf8");
  assert.doesNotMatch(sitemap, /\/karrier\/|\/en\/careers\//);
  const forbidden = /senior-ux-researcher|frontend-fejleszto|service-designer|ui-designer/;
  function check(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) check(url);
      else if (/\.(html|js|xml)$/.test(entry.name)) assert.doesNotMatch(fs.readFileSync(url, "utf8"), forbidden, url.pathname);
    }
  }
  check(new URL("dist/public/", root));
  console.log("PASS zero-job HU/EN SSR, empty copy, missing detail, sitemap and client artifact excludes all four demo slugs");
} finally {
  fs.writeFileSync(snapshot, original);
  assert.ok(fs.readFileSync(snapshot).equals(original), "snapshot restored byte-for-byte");
}