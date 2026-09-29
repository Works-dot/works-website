import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

let vite;
let seo;
let fallback;
let strapi;

before(async () => {
  vite = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
  });
  seo = await vite.ssrLoadModule("/src/seo-data.ts");
  fallback = await vite.ssrLoadModule("/src/data/fallback.ts");
  strapi = await vite.ssrLoadModule("/src/lib/strapi.ts");
});
after(async () => { await vite?.close(); });

const graphs = (meta, supplied) => seo.buildJsonLd(meta, undefined, supplied)
  .map((script) => JSON.parse(script.match(/<script[^>]*>([\s\S]*)<\/script>/)[1]));
const ofType = (nodes, type) => nodes.filter((node) => node["@type"] === type);

test("HU/EN service FAQ exactly matches published visible questions; missing content emits nothing", () => {
  for (const [locale, slug, path] of [
    ["hu", "ux-kutatas", "/szolgaltatasok/ux-kutatas"],
    ["en", "ux-research", "/en/services/ux-research"],
  ]) {
    const service = fallback.getLocaleFallback(`service:${slug}`, locale);
    const meta = seo.getPageMeta(path);
    const nodes = graphs(meta);
    const [schema] = ofType(nodes, "Service");
    const [faq] = ofType(nodes, "FAQPage");
    assert.equal(schema.name, service.title);
    assert.equal(schema.inLanguage, locale);
    assert.deepEqual(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
      service.faqSection.items.map((item) => [item.question, item.answer]));
    assert.equal(ofType(graphs(meta, { service: { ...service, faqSection: null } }), "FAQPage").length, 0);
    assert.equal(ofType(graphs(meta, { service: null }), "Service").length, 0);
  }
  assert.equal(ofType(graphs(seo.getPageMeta("/en/services/nonexistent")), "Service").length, 0);
});

test("no LocalBusiness claims a customer-facing office from registered or mailing addresses", () => {
  for (const path of ["/", "/en", "/kapcsolat", "/en/contact"]) {
    const nodes = graphs(seo.getPageMeta(path));
    assert.equal(ofType(nodes, "LocalBusiness").length, 0);
    assert.equal(ofType(nodes, "Organization").length, 1);
  }
});

test("jobs only on actual detail records; only sourced publication and office locality", () => {
  for (const [locale, path] of [["hu", "/karrier/ux-researcher"], ["en", "/en/careers/ux-researcher"]]) {
    const meta = seo.getPageMeta(path);
    const [job] = ofType(graphs(meta), "JobPosting");
    assert.equal(job.title, "UX Researcher");
    assert.equal(job.inLanguage, locale);
    assert.ok(job.description.includes("kutatás") || job.description.includes("research"));
    for (const key of ["datePosted", "validThrough", "baseSalary", "employmentType"]) {
      assert.equal(job[key], undefined, key);
    }
    assert.deepEqual(job.jobLocation.address, {
      "@type": "PostalAddress", addressLocality: "Budapest", addressCountry: "HU",
    });
    assert.equal(ofType(graphs(meta, { position: null }), "JobPosting").length, 0);
    const source = fallback.getLocaleFallback(`careerPosition:ux-researcher`, locale);
    const [dated] = ofType(graphs(meta, { position: {
      ...source, publishedAt: "2025-03-12T10:00:00.000Z", location: "Budapest / Hybrid",
    } }), "JobPosting");
    assert.equal(dated.datePosted, "2025-03-12T10:00:00.000Z");
    assert.equal(dated.jobLocation.address.addressLocality, "Budapest");
    assert.equal(dated.jobLocation.address.streetAddress, undefined);
    const [invalidDate] = ofType(graphs(meta, { position: {
      ...source, publishedAt: "unknown",
    } }), "JobPosting");
    assert.equal(invalidDate.datePosted, undefined);
    const [noOffice] = ofType(graphs(meta, { position: {
      ...source, location: "Budapest / Hybrid",
      content: [], excerpt: "A genuine job without a stated office",
    } }), "JobPosting");
    assert.equal(noOffice.jobLocation, undefined);
  }
  assert.equal(ofType(graphs(seo.getPageMeta("/karrier/nem-letezik")), "JobPosting").length, 0);
});

test("live Strapi mapping preserves the publishedAt of published active jobs only", async () => {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const publishedAt = "2025-03-12T10:00:00.000Z";
  const active = { slug: "verified-job", documentId: "id-1", title: "Verified job",
    publishedAt, isActive: true, tags: [], contentBlocks: [], excerpt: "A real job" };
  globalThis.window = { location: { origin: "https://example.test", search: "" } };
  globalThis.fetch = async (url) => {
    const request = new URL(url);
    assert.equal(request.searchParams.get("status"), "published");
    return { ok: true, json: async () => ({ data: [active, { ...active, isActive: false },
      { ...active, publishedAt: null }] }) };
  };
  try {
    const positions = await strapi.getCareerPositions("en");
    assert.equal(positions.length, 1);
    assert.equal(positions[0].publishedAt, publishedAt);
    assert.equal((await strapi.getCareerPositionBySlug("verified-job", "en"))?.publishedAt, publishedAt);
  } finally {
    globalThis.window = previousWindow;
    globalThis.fetch = previousFetch;
  }
});

test("about people are CMS-verified, not demo names; listing URLs match locale datasets", () => {
  for (const [locale, about, projects, blog] of [
    ["hu", "/rolunk", "/projektek", "/blog"],
    ["en", "/en/about", "/en/projects", "/en/blog"],
  ]) {
    const people = ofType(graphs(seo.getPageMeta(about)), "Person");
    assert.ok(people.length > 0);
    assert.ok(people.some((person) => person.name === "Lichter Tamás"));
    assert.equal(ofType(graphs(seo.getPageMeta(about), { team: [{ name: "Kovács Anna" }] }), "Person").length, 0);
    for (const [path, key] of [[projects, "projects"], [blog, "blogPosts"]]) {
      const items = fallback.getLocaleFallback(key, locale);
      const [list] = ofType(graphs(seo.getPageMeta(path)), "ItemList");
      assert.equal(list.itemListElement.length, items.length);
      assert.deepEqual(list.itemListElement.map((item) => item.position),
        items.map((_, index) => index + 1));
      assert.equal(list.inLanguage, locale);
      assert.equal(ofType(graphs(seo.getPageMeta(path), key === "projects" ? { projects: [] } : { posts: [] }), "ItemList").length, 0);
    }
  }
  assert.equal(ofType(graphs(seo.getPageMeta("/en/blog/not-a-list")), "ItemList").length, 0);
});

test("prerender and client use the same graph builder with one owned set", () => {
  const meta = seo.getPageMeta("/szolgaltatasok/ux-kutatas");
  const scripts = seo.buildJsonLd(meta);
  const head = seo.buildMetaTags(meta);
  assert.equal((head.match(/type="application\/ld\+json"/g) || []).length, scripts.length);
  assert.ok(scripts.every((script) => script.startsWith("<script data-ssr ")));
  const supplied = { service: fallback.getLocaleFallback("service:ux-kutatas", "hu") };
  assert.deepEqual(graphs(meta, supplied), graphs(meta));
});