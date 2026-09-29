import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
let vite;
let seo;
let fallback;

before(async () => {
  vite = await createServer({
    root,
    configFile: false,
    resolve: { alias: {
      "@": fileURLToPath(new URL("../src", import.meta.url)),
      "@assets": fileURLToPath(new URL("../../../attached_assets", import.meta.url)),
    } },
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
  });
  seo = await vite.ssrLoadModule("/src/seo-data.ts");
  fallback = await vite.ssrLoadModule("/src/data/fallback.ts");
});

after(async () => {
  await vite?.close();
});

const organization = (meta, settings) =>
  JSON.parse(seo.buildJsonLd(meta, settings)[0].match(/<script[^>]*>([\s\S]*)<\/script>/)[1]);

test("Organization sameAs includes every valid CMS profile, exactly as published", () => {
  const links = [
    { platform: "LinkedIn", url: "https://www.linkedin.com/company/works.-hungary-kft." },
    { platform: "Clutch", url: "https://clutch.co/profile/works-hungary-kft" },
    { platform: "Facebook", url: "https://www.facebook.com/works.hu/?ref=page#posts" },
    { platform: "Instagram", url: "https://www.instagram.com/works.hu/" },
    { platform: "Repeated", url: "https://clutch.co/profile/works-hungary-kft" },
    { platform: "Same host", url: "https://CLUTCH.CO/profile/works-hungary-kft" },
    { platform: "Empty", url: "" },
    { platform: "Placeholder", url: "#" },
    { platform: "Non-http", url: "javascript:alert(1)" },
    { platform: "Broken", url: "https://" },
    { platform: "Relative", url: "/social" },
    { platform: "Whitespace", url: " https://example.com" },
    { platform: "Backslash", url: "https://example.com\\@evil.test" },
  ];
  const expected = links.slice(0, 4).map(({ url }) => url);
  assert.deepEqual(seo.validSocialLinks(links).map(({ url }) => url), expected);
  assert.deepEqual(organization({ title: "Home", description: "Home", locale: "hu" }, { socialLinks: links }).sameAs, expected);
});

test("explicitly empty or unavailable settings do not invent social profiles", () => {
  const meta = { title: "Home", description: "Home", locale: "en" };
  assert.equal("sameAs" in organization(meta, { socialLinks: [] }), false);
  assert.equal("sameAs" in organization(meta, null), false);
});

test("SSR defaults use the matching locale's embedded CMS social profiles", () => {
  for (const locale of ["hu", "en"]) {
    const meta = { title: "Home", description: "Home", locale };
    const settings = fallback.getLocaleFallback("globalSettings", locale);
    const expected = seo.validSocialLinks(settings?.socialLinks).map(({ url }) => url);
    assert.deepEqual(organization(meta).sameAs ?? [], expected);
  }
});

test("footer uses Facebook and Clutch SVG marks instead of initials", () => {
  const source = readFileSync(new URL("../src/components/layout/Footer.tsx", import.meta.url), "utf8");
  assert.match(source, /data-social-icon="facebook"/);
  assert.match(source, /data-social-icon="clutch"/);
  assert.match(source, /platform\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /platform\.slice\(/);
  assert.match(source, /SOCIAL_ICONS\[key\] \|\| <LinkIcon/);
  assert.doesNotMatch(source, /href=["']#["']/);
});