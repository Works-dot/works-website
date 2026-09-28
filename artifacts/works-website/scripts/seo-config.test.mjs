import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
let vite;
let config;

before(async () => {
  vite = await createServer({
    root,
    configFile: false,
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    optimizeDeps: { noDiscovery: true },
  });
  config = await vite.ssrLoadModule("/src/seo-config.ts");
});

after(async () => {
  await vite?.close();
});

test("resolveSiteUrl accepts HTTPS origins and loopback HTTP for development", () => {
  assert.equal(config.resolveSiteUrl("https://example.test"), "https://example.test");
  assert.equal(config.resolveSiteUrl("https://example.test/"), "https://example.test");
  assert.equal(
    config.resolveSiteUrl(" https://example.test/ "),
    "https://example.test",
  );
  assert.equal(
    config.resolveSiteUrl("http://localhost:5173/"),
    "http://localhost:5173",
  );
  assert.equal(
    config.resolveSiteUrl("http://127.0.0.1:4173"),
    "http://127.0.0.1:4173",
  );
  assert.equal(config.resolveSiteUrl(), config.DEFAULT_SITE_URL);
  assert.equal(config.resolveSiteUrl(""), config.DEFAULT_SITE_URL);
});

test("resolveSiteUrl rejects non-origin and non-HTTPS values", () => {
  for (const value of [
    "https://example.test/path",
    "https://example.test/foo/..",
    "https://example.test//",
    "https://user:pass@example.test",
    "https://@example.test",
    "https://example.test?utm=launch",
    "https://example.test#section",
    "http://example.test",
    "ftp://example.test",
    "javascript:alert(1)",
    "https://",
    "https://example.test\\evil.test",
    null,
  ]) {
    assert.throws(
      () => config.resolveSiteUrl(value),
      /SITE_URL must be an HTTPS origin/,
      value,
    );
  }

  assert.throws(
    () => config.normalizeSiteUrl("https://example.test/path"),
    /SITE_URL must be an HTTPS origin/,
  );
});