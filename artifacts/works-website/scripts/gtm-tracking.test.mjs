import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { SpaPageViews, matchesRouteSnapshot, updateTrackingConsent } from "../src/lib/gtm-tracking.ts";
import { MAP_CONSENT_KEY, TRACKING_CONSENT_KEY, readConsent, saveConsent } from "../src/lib/consent-storage.ts";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const consentSource = readFileSync(new URL("../src/lib/cookie-consent.tsx", import.meta.url), "utf8");
const contactSource = readFileSync(new URL("../src/pages/Contact.tsx", import.meta.url), "utf8");
const granted = { analytics: true, advertising: true, map: true };
const denied = { analytics: false, advertising: false, map: false };
const grantedStorage = { getItem: (key) => key === TRACKING_CONSENT_KEY ? JSON.stringify({ version: 3, ...granted }) : null };

function storage(values = {}, failSet = false) {
  const items = new Map(Object.entries(values));
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem(key, value) {
      if (failSet) throw new Error("write denied");
      items.set(key, value);
    },
    removeItem: (key) => items.delete(key),
  };
}

function bootstrap(stored) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const window = { dataLayer: [{ existing: true }] };
  vm.runInNewContext(script, { window, localStorage: stored });
  const command = window.dataLayer[1];
  assert.equal(command[0], "consent");
  assert.equal(command[1], "default");
  return command[2];
}

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
  globalThis.window = { location: { origin: "https://works.hu", pathname: "/works-website/", search: "" }, dataLayer: [], localStorage: grantedStorage };
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
    page_location: "https://works.hu/works-website/en/projects?sort=recent",
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
    globalThis.window = { location: { origin: "https://works.hu", pathname, search: `?${query}` }, dataLayer: [], localStorage: grantedStorage };
    const tracker = new SpaPageViews();
    tracker.navigate("/");
    tracker.navigate(raw);
    assert.equal(matchesRouteSnapshot(raw, route, search, "/"), true, raw);
    tracker.seoCommitted(raw, "Fresh title");
    assert.deepEqual(window.dataLayer[0], {
      event: "page_view_spa", page_path: raw, page_title: "Fresh title",
      page_location: `https://works.hu${raw}`,
    });
    assert.equal(matchesRouteSnapshot(raw, "/old", search, "/"), false);
  }
});

test("distinct raw URLs sharing a decoded Wouter route still each emit on raw URL changes", () => {
  globalThis.window = { location: { origin: "https://works.hu", pathname: "/blog", search: "?q=design%20systems" }, dataLayer: [], localStorage: grantedStorage };
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
  globalThis.window = { location: { origin: "https://works.hu", pathname: "/", search: "" }, dataLayer: [{ existing: true }], localStorage: grantedStorage };
  const tracker = new SpaPageViews();
  tracker.navigate("/");
  tracker.seoCommitted("/", "Home");
  assert.equal(window.dataLayer.length, 1);
  window.location.pathname = "/blog";
  tracker.navigate("/blog");
  tracker.navigate("/blog");
  tracker.seoCommitted("/blog", "Blog");
  tracker.seoCommitted("/blog", "Blog later");
  assert.deepEqual(window.dataLayer[1], { event: "page_view_spa", page_path: "/blog", page_title: "Blog", page_location: "https://works.hu/blog" });
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
  updateTrackingConsent(granted);
  updateTrackingConsent(denied);
  assert.equal(window.dataLayer[1][2].analytics_storage, "granted");
  assert.equal(window.dataLayer[1][2].ad_storage, "granted");
  assert.equal(window.dataLayer[1][2].ad_user_data, "granted");
  assert.equal(window.dataLayer[1][2].ad_personalization, "granted");
  assert.equal(window.dataLayer[3][2].ad_storage, "denied");
  assert.equal(window.dataLayer[4].event, "works_consent_update");
});

test("all legacy or malformed choices are ignored, including legacy map permission", () => {
  for (const choice of ["accepted", "rejected", "null", "{}", '{"version":3,"analytics":true}', '{"version":3,"analytics":"true","advertising":false,"map":false}']) {
    const stored = storage({ [MAP_CONSENT_KEY]: "accepted", [TRACKING_CONSENT_KEY]: choice });
    assert.equal(readConsent(stored).map, null);
    assert.equal(readConsent(stored).tracking, null);
    assert.equal(readConsent(stored).purposes, null);
    assert.deepEqual(Object.values(bootstrap(stored)), ["denied", "denied", "denied", "denied"]);
  }
  assert.match(consentSource, /setBannerOpen\(stored === null\)/);
});

test("loading the map alone never updates measurement or ads", () => {
  const stored = storage();
  const mapOnly = { ...denied, map: true };
  assert.equal(saveConsent(stored, mapOnly), true);
  assert.deepEqual(readConsent(stored), { map: "accepted", tracking: "rejected", purposes: mapOnly });
  assert.deepEqual(Object.values(bootstrap(stored)), ["denied", "denied", "denied", "denied"]);
  assert.match(contactSource, /onClick=\{acceptMap\}/);
});

test("all eight purpose combinations match bootstrap, persisted decision and Consent Mode updates", () => {
  for (const analytics of [false, true]) for (const advertising of [false, true]) for (const map of [false, true]) {
    const purposes = { analytics, advertising, map };
    const stored = storage();
    assert.equal(saveConsent(stored, purposes), true);
    assert.deepEqual(readConsent(stored).purposes, purposes);
    const expected = [analytics ? "granted" : "denied", ...Array(3).fill(advertising ? "granted" : "denied")];
    assert.deepEqual(Object.values(bootstrap(stored)), expected);
    globalThis.window = { location: { pathname: "/", search: "" }, dataLayer: [] };
    updateTrackingConsent(purposes);
    assert.deepEqual(Object.values(window.dataLayer[0][2]), expected);
    assert.equal(window.dataLayer[1].consent_state, expected[0]);
    assert.equal(window.dataLayer[1].map_consent, map ? "granted" : "denied");
  }
});

test("revoke removes stale accepted on failed storage overwrites and reload denies", () => {
  const stored = storage({ [TRACKING_CONSENT_KEY]: JSON.stringify({ version: 3, ...granted }) }, true);
  assert.equal(saveConsent(stored, denied), false);
  assert.deepEqual(readConsent(stored), { map: null, tracking: null, purposes: null });
  assert.deepEqual(Object.values(bootstrap(stored)), ["denied", "denied", "denied", "denied"]);
  const blocked = { getItem() { throw new Error("blocked"); } };
  assert.deepEqual(readConsent(blocked), { map: null, tracking: null, purposes: null });
  assert.deepEqual(Object.values(bootstrap(blocked)), ["denied", "denied", "denied", "denied"]);
});

test("fully blocked revocation reports failure rather than pretending an old grant was removed", () => {
  const stuck = {
    getItem: (key) => key === TRACKING_CONSENT_KEY ? "accepted" : null,
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.equal(saveConsent(stuck, denied), false);
  assert.match(consentSource, /setStorageError\(!saved\)/);
  assert.match(consentSource, /const effective = saved \? next : DENIED_PURPOSES/);
});

test("pending lazy navigation that returns to the initial URL cannot duplicate the initial view", () => {
  globalThis.window = { location: { origin: "https://works.hu", pathname: "/", search: "" }, dataLayer: [], localStorage: grantedStorage };
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

function trackingBrowser(choice) {
  globalThis.window = {
    location: { origin: "https://works.hu", pathname: "/", search: "" },
    dataLayer: [],
    localStorage: { getItem: (key) => key === TRACKING_CONSENT_KEY && choice
      ? JSON.stringify({ version: 3, ...denied, analytics: choice === "accepted" }) : null },
  };
  return new SpaPageViews();
}

test("first grant claims pending live SPA URL before delayed SEO and permits the next navigation", () => {
  const tracker = trackingBrowser(null);
  tracker.navigate("/");
  window.location.pathname = "/en/contact";
  tracker.navigate("/en/contact");
  tracker.consentUpdated(true);
  tracker.seoCommitted("/en/contact", "Contact (late)");
  assert.deepEqual(window.dataLayer, []);
  window.location.pathname = "/en/projects";
  tracker.navigate("/en/projects");
  tracker.seoCommitted("/en/projects", "Projects");
  assert.deepEqual(window.dataLayer, [
    { event: "page_view_spa", page_path: "/en/projects", page_title: "Projects", page_location: "https://works.hu/en/projects" },
  ]);
});

test("grant before route navigation, and denied SEO before grant, do not replay or double first view", () => {
  const early = trackingBrowser(null);
  early.navigate("/");
  early.consentUpdated(true);
  window.location.pathname = "/blog";
  early.navigate("/blog");
  early.seoCommitted("/blog", "Blog");
  assert.equal(window.dataLayer.length, 1); // genuinely after grant

  const late = trackingBrowser(null);
  late.navigate("/");
  window.location.pathname = "/blog";
  late.navigate("/blog");
  late.seoCommitted("/blog", "Blog");
  assert.deepEqual(window.dataLayer, []); // never queue denied views for delayed GTM
  late.consentUpdated(true);
  late.seoCommitted("/blog", "Blog");
  assert.deepEqual(window.dataLayer, []);
});

test("bootstrap-granted Google tag remains owned across revoke/regrant and does not swallow pending SPA", () => {
  const tracker = trackingBrowser("accepted");
  tracker.navigate("/");
  tracker.consentUpdated(false);
  window.location.pathname = "/new";
  tracker.navigate("/new");
  tracker.consentUpdated(true);
  tracker.seoCommitted("/new", "New page");
  assert.deepEqual(window.dataLayer, [
    { event: "page_view_spa", page_path: "/new", page_title: "New page", page_location: "https://works.hu/new" },
  ]);
  tracker.consentUpdated(false);
  tracker.consentUpdated(true);
  assert.equal(window.dataLayer.length, 1);
});

test("grant consumes only the current pending path, not a newer navigation", () => {
  const tracker = trackingBrowser("rejected");
  tracker.navigate("/");
  window.location.pathname = "/slow";
  tracker.navigate("/slow");
  tracker.consentUpdated(true);
  window.location.pathname = "/faster";
  tracker.navigate("/faster");
  tracker.seoCommitted("/slow", "Stale");
  tracker.seoCommitted("/faster", "Fresh");
  assert.deepEqual(window.dataLayer, [
    { event: "page_view_spa", page_path: "/faster", page_title: "Fresh", page_location: "https://works.hu/faster" },
  ]);
});