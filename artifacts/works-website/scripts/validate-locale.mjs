/**
 * validate-locale.mjs — Pure helper validation for i18n-routes.
 *
 * Runs without any extra dependencies; uses only Node built-ins.
 * Validates the logic of the locale/route module by importing the compiled
 * JS from dist/server if available, or falls back to direct source analysis.
 *
 * Usage: node scripts/validate-locale.mjs
 *
 * Also importable by prerender.mjs for CI assertions.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function assertThrows(label, fn) {
  try {
    fn();
    console.error(`  ✗ FAIL (expected throw): ${label}`);
    failed++;
  } catch {
    console.log(`  ✓ ${label}`);
    passed++;
  }
}

// ---------------------------------------------------------------------------
// Try to import from compiled dist; fall back to source-level JS checks.
// ---------------------------------------------------------------------------

async function runValidation() {
  console.log("\nLocale/route validation\n");

  let mod;
  try {
    mod = await import(path.resolve(root, "dist/server/entry-server.js"));
    console.log("  [using compiled dist/server/entry-server.js]\n");
  } catch {
    console.log("  [dist not built — running source-level checks only]\n");
    runSourceLevelChecks();
    printSummary();
    return;
  }

  const {
    PUBLIC_LOCALES,
    getStaticPathsForLocale,
    buildLocalePath,
    getLocaleFromPath,
    matchLocalePath,
    extractSearch,
    stripSearch,
    localeQueryKey,
    getPageMeta,
    buildMetaTags,
    SITE_URL,
  } = mod;

  // ------------------------------------------------------------------
  // PUBLIC_LOCALES assertions
  // ------------------------------------------------------------------
  console.log("PUBLIC_LOCALES:");
  assert("PUBLIC_LOCALES contains 'hu'", PUBLIC_LOCALES.includes("hu"));
  assert("PUBLIC_LOCALES does NOT contain 'en'", !PUBLIC_LOCALES.includes("en"));
  assert("PUBLIC_LOCALES length is 1", PUBLIC_LOCALES.length === 1);

  // ------------------------------------------------------------------
  // getStaticPathsForLocale assertions
  // ------------------------------------------------------------------
  console.log("\ngetStaticPathsForLocale:");
  const huPaths = getStaticPathsForLocale("hu");
  assert("HU has 8 static paths", huPaths.length === 8);
  assert("HU paths include '/'", huPaths.includes("/"));
  assert("HU paths include '/projektek'", huPaths.includes("/projektek"));
  assert("HU paths include '/blog'", huPaths.includes("/blog"));
  assert("HU paths include '/rolunk'", huPaths.includes("/rolunk"));
  assert("HU paths include '/kapcsolat'", huPaths.includes("/kapcsolat"));
  assert("HU paths include '/karrier'", huPaths.includes("/karrier"));
  assert("HU paths include '/adatkezeles'", huPaths.includes("/adatkezeles"));
  assert("HU paths include '/sutik'", huPaths.includes("/sutik"));
  assert("HU paths have no /en prefix", huPaths.every((p) => !p.startsWith("/en")));
  assertThrows(
    "getStaticPathsForLocale('en') throws (EN not public)",
    () => getStaticPathsForLocale("en")
  );

  // ------------------------------------------------------------------
  // buildLocalePath assertions
  // ------------------------------------------------------------------
  console.log("\nbuildLocalePath:");
  assert(
    "HU home path is '/'",
    buildLocalePath("hu", "home") === "/"
  );
  assert(
    "HU projects path is '/projektek'",
    buildLocalePath("hu", "projects") === "/projektek"
  );
  assert(
    "HU projectDetail with slug",
    buildLocalePath("hu", "projectDetail", "my-project") === "/projektek/my-project"
  );
  assert(
    "HU blog path is '/blog'",
    buildLocalePath("hu", "blog") === "/blog"
  );
  assert(
    "HU contact path is '/kapcsolat'",
    buildLocalePath("hu", "contact") === "/kapcsolat"
  );
  assert(
    "EN (future) home path is '/en'",
    buildLocalePath("en", "home") === "/en"
  );
  assert(
    "EN (future) projects path is '/en/projects'",
    buildLocalePath("en", "projects") === "/en/projects"
  );
  assert(
    "EN projectDetail with slug",
    buildLocalePath("en", "projectDetail", "my-project") === "/en/projects/my-project"
  );
  assert(
    "buildLocalePath preserves query+hash",
    buildLocalePath("hu", "projectDetail", "test", "?preview=1#top") === "/projektek/test?preview=1#top"
  );

  // ------------------------------------------------------------------
  // Path parsing
  // ------------------------------------------------------------------
  console.log("\ngetLocaleFromPath / matchLocalePath:");
  assert("HU path resolves to hu", getLocaleFromPath("/projektek") === "hu");
  assert("Reserved EN path resolves to en", getLocaleFromPath("/en/projects?preview=1") === "en");
  assert("Unknown /en path still resolves to en", getLocaleFromPath("/en/not-yet-known") === "en");
  assert(
    "Reserved EN privacy route matches central map",
    matchLocalePath("/en/privacy")?.routeKey === "privacy"
  );
  const enProjectMatch = matchLocalePath("/en/projects/future-project");
  assert(
    "Reserved EN project detail returns route key and slug",
    enProjectMatch?.locale === "en" &&
      enProjectMatch?.routeKey === "projectDetail" &&
      enProjectMatch?.slug === "future-project"
  );

  // ------------------------------------------------------------------
  // extractSearch / stripSearch
  // ------------------------------------------------------------------
  console.log("\nextractSearch / stripSearch:");
  assert(
    "extractSearch with query+hash",
    extractSearch("/blog/post?foo=1#section") === "?foo=1#section"
  );
  assert(
    "extractSearch with hash only",
    extractSearch("/rolunk#team") === "#team"
  );
  assert(
    "extractSearch with no search",
    extractSearch("/rolunk") === ""
  );
  assert(
    "stripSearch removes query+hash",
    stripSearch("/projektek/slug?preview=1#top") === "/projektek/slug"
  );
  assert(
    "stripSearch with no search unchanged",
    stripSearch("/rolunk") === "/rolunk"
  );

  // ------------------------------------------------------------------
  // localeQueryKey
  // ------------------------------------------------------------------
  console.log("\nlocaleQueryKey:");
  assert(
    "base only → single element",
    localeQueryKey("projects").join(":") === "projects"
  );
  assert(
    "base + locale → two elements",
    localeQueryKey("projects", "hu").join(":") === "projects:hu"
  );
  assert(
    "base + locale + extra → three elements",
    localeQueryKey("project", "en", "slug").join(":") === "project:en:slug"
  );

  // ------------------------------------------------------------------
  // getPageMeta — HU locale preserved
  // ------------------------------------------------------------------
  console.log("\ngetPageMeta (HU locale):");
  const homeMeta = getPageMeta("/", "hu");
  assert("HU home meta has locale 'hu'", homeMeta.locale === "hu");
  assert("HU home meta title is non-empty", homeMeta.title.length > 0);

  const blogMeta = getPageMeta("/blog", "hu");
  assert("HU blog meta has locale 'hu'", blogMeta.locale === "hu");

  // Default locale when none passed
  const defaultMeta = getPageMeta("/rolunk");
  assert("No-locale call defaults to hu", defaultMeta.locale === "hu");

  console.log("\ngetPageMeta (reserved EN routes):");
  const enProjectsMeta = getPageMeta("/en/projects");
  assert("Reserved EN route infers locale 'en'", enProjectsMeta.locale === "en");
  assert("Reserved EN route preserves canonical path", enProjectsMeta.path === "/en/projects");
  assert("Reserved EN route uses English generic metadata", enProjectsMeta.title === "Works. | Digital Agency");
  const enProjectMeta = getPageMeta("/en/projects/future-project");
  assert("Reserved EN detail is article metadata", enProjectMeta.type === "article");

  // ------------------------------------------------------------------
  // buildMetaTags — og:locale correct for HU
  // ------------------------------------------------------------------
  console.log("\nbuildMetaTags (og:locale):");
  const huTags = buildMetaTags(homeMeta);
  assert(
    "HU home has og:locale=hu_HU",
    huTags.includes('content="hu_HU"')
  );
  assert(
    "HU home does NOT have og:locale=en_US",
    !huTags.includes('content="en_US"')
  );
  const enTags = buildMetaTags(enProjectsMeta);
  assert("Reserved EN route has og:locale=en_US", enTags.includes('content="en_US"'));
  assert(
    "Reserved EN route has its own canonical URL",
    enTags.includes(`rel="canonical" href="${SITE_URL}/en/projects"`)
  );

  // ------------------------------------------------------------------
  // No /en route in any PUBLIC output
  // ------------------------------------------------------------------
  console.log("\nEN route guard:");
  assert(
    "SITE_URL is defined",
    typeof SITE_URL === "string" && SITE_URL.length > 0
  );
  const inventory = readFileSync(path.resolve(root, "../../docs/i18n/translation-inventory.md"), "utf-8");
  const rollout = readFileSync(path.resolve(root, "../../docs/i18n/strapi-rollout.md"), "utf-8");
  assert("Translation inventory uses /en/privacy", inventory.includes("/en/privacy"));
  assert("Rollout plan uses /en/privacy", rollout.includes("/en/privacy"));
  assert("Rollout docs do not reserve /en/privacy-policy", !rollout.includes("/en/privacy-policy"));
  assert(
    "Inventory records the publication gate as present",
    inventory.includes("The field exists in")
  );

  printSummary();
}

function runSourceLevelChecks() {
  // When dist is not available we do lightweight structural checks.
  console.log("Source-level checks:");

  // Check that i18n-routes.ts source contains the expected exports
  try {
    const src = readFileSync(
      path.resolve(root, "src/lib/i18n-routes.ts"),
      "utf-8"
    );
    assert("i18n-routes exports PUBLIC_LOCALES", src.includes("export const PUBLIC_LOCALES"));
    assert("i18n-routes exports DEFAULT_LOCALE", src.includes("export const DEFAULT_LOCALE"));
    assert("i18n-routes exports buildLocalePath", src.includes("export function buildLocalePath"));
    assert("i18n-routes exports getLocaleFromPath", src.includes("export function getLocaleFromPath"));
    assert("i18n-routes exports matchLocalePath", src.includes("export function matchLocalePath"));
    assert("i18n-routes exports extractSearch", src.includes("export function extractSearch"));
    assert("i18n-routes exports stripSearch", src.includes("export function stripSearch"));
    assert("i18n-routes exports getStaticPathsForLocale", src.includes("export function getStaticPathsForLocale"));
    assert("i18n-routes exports localeQueryKey", src.includes("export function localeQueryKey"));
    assert(
      "PUBLIC_LOCALES contains hu only",
      /PUBLIC_LOCALES[^=]*= \[["']hu["']\]/.test(src)
    );
    assert("EN paths reserved but not public", src.includes("EN_STATIC_PATHS"));
    assert("getStaticPathsForLocale guards against non-public locales", src.includes("not in PUBLIC_LOCALES"));
  } catch (e) {
    console.error("  Could not read i18n-routes.ts:", e.message);
    failed++;
  }
}

function printSummary() {
  console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runValidation().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
