import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import { transformWithEsbuild } from "vite";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const rawStrapi = read("src/lib/strapi.ts").replaceAll("import.meta.env", '({ BASE_URL: "/" })').replace(
  '"./content-blocks.js"', JSON.stringify(new URL("../src/lib/content-blocks.js", import.meta.url).href),
);
const { code } = await transformWithEsbuild(rawStrapi, "strapi.ts", { loader: "ts" });
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const active = { documentId: "cms-test", slug: "genuine-cms-position", title: "Published CMS position", isActive: true, publishedAt: "2026-01-01", contentBlocks: [] };

test("HU/EN live API: zero, one, inactive, draft, errors; detail cannot bypass publication", async () => {
  const oldFetch = globalThis.fetch;
  const oldWindow = globalThis.window;
  globalThis.window = { location: { origin: "https://example.test", search: "?status=draft" } };
  try {
    for (const locale of ["hu", "en"]) {
      for (const rows of [[], [active], [{ ...active, isActive: false }], [{ ...active, publishedAt: null }]]) {
        globalThis.fetch = async (url) => {
          const params = new URL(url).searchParams;
          assert.equal(params.get("locale"), locale);
          assert.equal(params.get("status"), "published");
          assert.equal(params.get("filters[isActive][$eq]"), "true");
          return { ok: true, json: async () => ({ data: rows }) };
        };
        const visible = rows.filter((r) => r.isActive && r.publishedAt);
        assert.equal((await api.getCareerPositions(locale)).length, visible.length);
        assert.equal((await api.getCareerPositionBySlug(active.slug, locale))?.slug ?? null, visible[0]?.slug ?? null);
      }
      globalThis.fetch = async () => ({ ok: false, status: 503, statusText: "Unavailable" });
      await assert.rejects(api.getCareerPositions(locale), /503/);
      await assert.rejects(api.getCareerPositionBySlug(active.slug, locale), /503/);
    }
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});

async function hookHarness(enabled) {
  let cursor = 0;
  const states = [], effects = [], deps = [], cleanups = [];
  const events = new Map();
  let interval;
  const source = read("src/hooks/useStrapiQuery.ts")
    .replace(/^import .*;\r?$/gm, "")
    .replace("import.meta.env.VITE_STRAPI_ENABLED", JSON.stringify(enabled ? "true" : "false"))
    .replace("export function", "function");
  const transformed = await transformWithEsbuild(source, "hook.ts", { loader: "ts" });
  const context = {
    Error,
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
      return [states[i], (value) => { states[i] = value; }];
    },
    useRef(value) { const i = cursor++; return states[i] ??= { current: value }; },
    useEffect(effect, next) {
      const i = cursor++;
      if (!deps[i] || next.some((value, j) => value !== deps[i][j])) {
        effects.push(() => { cleanups[i]?.(); cleanups[i] = effect(); });
        deps[i] = next;
      }
    },
    getLocaleFallback: (key) => key === "careerPositions" ? [active] : active,
    window: {
      setInterval(fn) { interval = fn; return 1; },
      clearInterval() { interval = undefined; },
      addEventListener(name, fn) { events.set(name, fn); },
      removeEventListener(name) { events.delete(name); },
    },
  };
  vm.createContext(context);
  vm.runInContext(`${transformed.code}\nthis.query = useStrapiQuery;`, context);
  return {
    render(key, fetcher, locale) { cursor = 0; return context.query(key, fetcher, undefined, locale); },
    async flush() { effects.splice(0).forEach((fn) => fn()); await new Promise(setImmediate); },
    focus() { events.get("focus")?.(); },
    poll() { interval?.(); },
    close() { cleanups.forEach((fn) => fn?.()); },
  };
}

test("career hook bypasses stale cache, refreshes on mount/focus/poll, clears errors and locale/slug data", async () => {
  for (const locale of ["hu", "en"]) {
    const h = await hookHarness(true);
    let rows = [active], fail = false;
    const fetcher = async () => { if (fail) throw new Error("offline"); return rows; };
    let view = h.render("careerPositions", fetcher, locale);
    assert.equal(view.data, null);
    assert.equal(view.loading, true);
    await h.flush();
    assert.equal(h.render("careerPositions", fetcher, locale).data.length, 1);
    rows = [];
    h.focus();
    await h.flush();
    assert.equal(h.render("careerPositions", fetcher, locale).data.length, 0);
    fail = true;
    h.poll();
    await h.flush();
    view = h.render("careerPositions", fetcher, locale);
    assert.equal(view.data, null);
    assert.equal(view.error, "offline");
    view = h.render("careerPosition:other", fetcher, locale === "hu" ? "en" : "hu");
    assert.equal(view.data, null);
    assert.equal(view.error, null);
    assert.equal(view.loading, true);
    fail = false;
    await h.flush();
    assert.equal(h.render("careerPosition:other", fetcher, locale === "hu" ? "en" : "hu").error, null);
    h.close();
  }
});

test("static production retains genuine embedded CMS jobs without fetching", async () => {
  const h = await hookHarness(false);
  for (const locale of ["hu", "en"]) {
    const view = h.render("careerPositions", () => { throw new Error("must not fetch"); }, locale);
    assert.equal(view.data[0].slug, active.slug);
    assert.equal(view.loading, false);
    await h.flush();
  }
  h.close();
});

test("build fetch also excludes inactive/draft positions", () => {
  const source = read("scripts/fetch-strapi-data.mjs");
  const section = source.slice(source.indexOf("  const careersRes"), source.indexOf('  console.log(`  ✓ ${cache.positions.length}'));
  assert.match(section, /filters\[isActive\]\[\$eq\]=true&status=published/);
  for (const rows of [[], [active], [{ ...active, isActive: false }], [{ ...active, publishedAt: null }]]) {
    const mapping = section.slice(section.indexOf("  cache.positions"));
    const context = { cache: {}, careersRes: { data: rows }, mapContentBlocks: () => [], mapSeo: () => null };
    vm.runInNewContext(mapping, context);
    assert.equal(context.cache.positions.length, rows.filter((r) => r.isActive && r.publishedAt).length);
  }
});