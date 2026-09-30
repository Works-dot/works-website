import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SpaPageViews, matchesRouteSnapshot, updateTrackingConsent } from "../src/lib/gtm-tracking.ts";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("shared HTML attempts GTM once, keeps initial consent ahead of GTM and embeds noscript", () => {
  assert.equal((html.match(/GTM-5JQBSGDS/g) || []).length, 2);
  assert.ok(Buffer.byteLength(html.slice(0, html.indexOf('<meta charset="UTF-8" />'))) < 1024);
  assert.ok(html.indexOf('<meta charset="UTF-8" />') < html.indexOf("gtag("));
  assert.match(html, /window\.dataLayer = window\.dataLayer \|\| \[\]/);
  assert.ok(html.indexOf('gtag("consent", "default"') < html.indexOf("gtm.start"));
  assert.match(html, /gtm\.js\?id=/);
  assert.match(html, /<body>\s*<!-- Google Tag Manager \(noscript\) -->\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-5JQBSGDS"/);
});

test("raw mounted URLs match their decoded Wouter snapshot but retain original encoding", () => {
  assert.equal(matchesRouteSnapshot("/", "/", "", "/"), true);
  assert.equal(matchesRouteSnapshot("/works-website/", "/", "", "/works-website/"), true);
  assert.equal(matchesRouteSnapshot("/works-website/en/projects?sort=recent", "/en/projects", "sort=recent", "/works-website/"), true);
  globalThis.window = { location: { pathname: "/works-website/", search: "" }, dataLayer: [] };
  const tracker = new SpaPageViews();
  tracker.navigate("/works-website/");
  window.location.pathname = "/works-website/en/projects";
  window.location.search = "?sort=recent";
  tracker.navigate("/works-website/en/projects?sort=recent");
  tracker.seoCommitted("/works-website/en/projects?sort=recent", "Projects");
  assert.deepEqual(window.dataLayer[0], {
    event: "page_view_spa",
    page_path: "/works-website/en/projects?sort=recent",
    page_title: "Projects",
  });
});

test("encoded query and pathname keep their actual bytes through SEO acknowledgment", () => {
  const samples = [
    ["/blog?q=design%20systems", "/blog", "q=design systems"],
    ["/blog?q=R%26D", "/blog", "q=R%26D"],
    ["/blog?q=100%25", "/blog", "q=100%"],
    ["/en/blog/design%20systems?q=100%25%26more", "/en/blog/design systems", "q=100%%26more"],
  ];
  for (const [raw, route, search] of samples) {
    const [pathname, query] = raw.split("?");
    globalThis.window = { location: { pathname, search: `?${query}` }, dataLayer: [] };
    const tracker = new SpaPageViews();
    tracker.navigate("/");
    tracker.navigate(raw);
    assert.equal(matchesRouteSnapshot(raw, route, search, "/"), true, raw);
    tracker.seoCommitted(raw, "Fresh title");
    assert.deepEqual(window.dataLayer[0], {
      event: "page_view_spa", page_path: raw, page_title: "Fresh title",
    });
    assert.equal(matchesRouteSnapshot(raw, "/old", search, "/"), false);
  }
});

test("distinct raw URLs sharing a decoded Wouter route still each emit on raw URL changes", () => {
  globalThis.window = { location: { pathname: "/blog", search: "?q=design%20systems" }, dataLayer: [] };
  const tracker = new SpaPageViews();
  tracker.navigate("/blog?q=design%20systems");
  window.location.search = "?q=design systems";
  tracker.navigate("/blog?q=design systems");
  assert.equal(matchesRouteSnapshot("/blog?q=design systems", "/blog", "q=design systems", "/"), true);
  tracker.seoCommitted("/blog?q=design%20systems", "Old title");
  tracker.seoCommitted("/blog?q=design systems", "New title");
  assert.equal(window.dataLayer.length, 1);
  assert.equal(window.dataLayer[0].page_path, "/blog?q=design systems");
});

test("SPA pages wait for committed SEO, dedupe hydration and refuse obsolete routes", () => {
  globalThis.window = { location: { pathname: "/", search: "" }, dataLayer: [{ existing: true }] };
  const tracker = new SpaPageViews();
  tracker.navigate("/");
  tracker.seoCommitted("/", "Home");
  assert.equal(window.dataLayer.length, 1);
  window.location.pathname = "/blog";
  tracker.navigate("/blog");
  tracker.navigate("/blog");
  tracker.seoCommitted("/blog", "Blog");
  tracker.seoCommitted("/blog", "Blog later");
  assert.deepEqual(window.dataLayer[1], { event: "page_view_spa", page_path: "/blog", page_title: "Blog" });
  window.location.pathname = "/en/about";
  tracker.navigate("/en/about");
  window.location.pathname = "/en/projects";
  tracker.navigate("/en/projects");
  tracker.seoCommitted("/en/about", "Stale");
  tracker.seoCommitted("/en/projects", "Projects");
  assert.equal(window.dataLayer.length, 3);
  window.location.search = "?sort=recent";
  tracker.navigate("/en/projects?sort=recent");
  tracker.seoCommitted("/en/projects?sort=recent", "Projects");
  assert.equal(window.dataLayer[3].page_path, "/en/projects?sort=recent");
  window.location.search = "";
  tracker.navigate("/en/projects");
  tracker.seoCommitted("/en/projects", "Projects");
  assert.equal(window.dataLayer.length, 5);
  tracker.navigate("/en/projects"); // hash-only navigation
  tracker.seoCommitted("/en/projects", "Projects");
  assert.equal(window.dataLayer.length, 5);
});

test("consent updates all four signals and emits stable grant/revoke event", () => {
  globalThis.window = { location: { pathname: "/", search: "" }, dataLayer: [{ existing: true }] };
  updateTrackingConsent(true);
  updateTrackingConsent(false);
  assert.equal(window.dataLayer[1][2].analytics_storage, "granted");
  assert.equal(window.dataLayer[1][2].ad_storage, "granted");
  assert.equal(window.dataLayer[1][2].ad_user_data, "granted");
  assert.equal(window.dataLayer[1][2].ad_personalization, "granted");
  assert.equal(window.dataLayer[3][2].ad_storage, "denied");
  assert.equal(window.dataLayer[4].event, "works_consent_update");
});

test("pending lazy navigation that returns to the initial URL cannot duplicate the initial view", () => {
  globalThis.window = { location: { pathname: "/", search: "" }, dataLayer: [] };
  const tracker = new SpaPageViews();
  tracker.navigate("/");
  tracker.navigate("/slow");
  tracker.navigate("/");
  tracker.seoCommitted("/slow", "Late CMS title");
  tracker.seoCommitted("/", "Home");
  assert.equal(window.dataLayer.length, 0);
  tracker.navigate("/slow");
  window.location.pathname = "/slow";
  tracker.seoCommitted("/slow", "Fresh CMS title");
  assert.equal(window.dataLayer[0].page_title, "Fresh CMS title");
});