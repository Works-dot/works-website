import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  canonicalRedirectLocation,
  createApp,
  parseCanonicalOrigin,
} from "../server.mjs";
import {
  ProviderTimeoutError,
  withTimeout,
} from "../server-error.mjs";
import { validateStaticBuild } from "../server-health.mjs";
import { buildLegacyRedirects, readLegacyRedirects, LEGACY_PATHS } from "../legacy-redirects.mjs";

let fixtureRoot;
let servers = [];

function writeFixture({ missingAsset = false } = {}) {
  const distDir = path.join(fixtureRoot, "dist", "public");
  fs.mkdirSync(path.join(distDir, "en", "assets"), { recursive: true });
  fs.mkdirSync(path.join(distDir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(distDir, "media"), { recursive: true });

  const html = (localePath) => `<!doctype html>
<html lang="${localePath === "/en" ? "en" : "hu"}">
  <head>
    <link rel="stylesheet" href="/assets/site.css">
    <script type="module" src="/assets/site.js"></script>
  </head>
  <body><div id="root"><main>Works. ${localePath}</main></div></body>
</html>`;
  fs.writeFileSync(path.join(distDir, "index.html"), html("/"));
  fs.writeFileSync(path.join(distDir, "en", "index.html"), html("/en"));
  fs.writeFileSync(path.join(distDir, "assets", "site.js"), "console.log('ok')");
  fs.writeFileSync(path.join(distDir, "media", "test-abc123.webp"), "fixture");
  fs.writeFileSync(
    path.join(distDir, "assets", "site.css"),
    missingAsset ? "body { background: url('/assets/missing.png') }" : "body { color: black }",
  );
  return distDir;
}

async function listen(app) {
  const server = http.createServer(app);
  servers.push(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
  fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "works-server-"));
});

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve) => {
          if (!server.listening) {
            resolve();
            return;
          }
          server.close(() => resolve());
        }),
    ),
  );
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("website health endpoints", () => {
  it("temporarily redirects unapproved English legal routes before canonical/static handling", async () => {
    const base = await listen(createApp({
      distDir: writeFixture(), canonicalOrigin: "https://www.worksdot.hu",
    }));
    for (const [source, target] of Object.entries({
      "/en/privacy": "/adatkezeles", "/en/cookies": "/sutik", "/en/imprint": "/impresszum",
    })) {
      for (const method of ["GET", "HEAD"]) {
        for (const suffix of ["", "/", "?x=1&x=2", "/?x=1&x=2"]) {
          const response = await fetch(base + source + suffix, { method, redirect: "manual" });
          assert.equal(response.status, 302);
          assert.equal(response.headers.get("location"), target + (suffix.includes("?") ? "?x=1&x=2" : ""));
          assert.equal(response.headers.get("x-robots-tag"), "noindex");
          assert.equal(response.headers.get("cache-control"), "no-store");
        }
      }
    }
  });
  it("redirects every approved legacy route directly, preserving queries and method boundaries", async () => {
    const redirects = buildLegacyRedirects();
    assert.equal(Object.keys(redirects).length, 29);
    const base = await listen(createApp({
      distDir: writeFixture(), canonicalOrigin: "https://www.worksdot.hu",
      legacyRedirects: redirects,
    }));
    for (const [source, destination] of Object.entries(redirects)) {
      for (const method of ["GET", "HEAD"]) {
        for (const suffix of ["", "/", "?utm=a%20b&tag=x&tag=y", "/?utm=a%20b&tag=x&tag=y"]) {
          const response = await fetch(base + source + suffix, { method, redirect: "manual" });
          assert.equal(response.status, 301, `${method} ${source}${suffix}`);
          assert.equal(response.headers.get("location"),
            destination + (suffix.includes("?") ? "?utm=a%20b&tag=x&tag=y" : ""));
          assert.equal(await response.text(), "");
        }
      }
    }
    const isolated = await listen(createApp({ distDir: writeFixture(), canonicalOrigin: null, legacyRedirects: redirects }));
    for (const route of ["/about/child", "/about-extra", "/en/about-old", "/unknown", "/impresszum", "/api/unknown", "/strapi/unknown"]) {
      const response = await fetch(isolated + route, { redirect: "manual" });
      assert.equal(response.status, 404, route);
      assert.equal(response.headers.get("location"), null);
    }
    for (const route of ["/", "/en", "/healthz", "/readyz", "/assets/site.js", "/media/test-abc123.webp"]) {
      assert.equal((await fetch(isolated + route)).status, 200, route);
    }
    for (const source of Object.keys(LEGACY_PATHS)) {
      const response = await fetch(isolated + source, { method: "POST", redirect: "manual" });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("location"), null);
    }
    assert.equal(redirects["/imprint"], "https://www.worksdot.hu/impresszum");
    assert.equal(redirects["/terms"], "https://www.worksdot.hu/impresszum");
    const distDir = writeFixture();
    assert.throws(() => readLegacyRedirects(distDir));
    fs.writeFileSync(path.join(distDir, "..", "legacy-redirects.json"), JSON.stringify(redirects));
    assert.deepEqual(readLegacyRedirects(distDir), redirects);
    fs.writeFileSync(path.join(distDir, "..", "legacy-redirects.json"), JSON.stringify({...redirects, "/about": "https://evil.example/"}));
    assert.throws(() => readLegacyRedirects(distDir), /approved routes/);
  });

  it("reports liveness independently and readiness for both locales", async () => {
    const distDir = writeFixture();
    const baseUrl = await listen(createApp({ distDir }));

    const live = await fetch(`${baseUrl}/healthz`);
    assert.equal(live.status, 200);
    assert.equal(live.headers.get("cache-control"), "no-store, no-cache, must-revalidate");
    assert.deepEqual(await live.json(), { ok: true, status: "alive" });

    const ready = await fetch(`${baseUrl}/readyz`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { ok: true, status: "ready" });

    const media = await fetch(`${baseUrl}/media/test-abc123.webp`);
    assert.equal(media.status, 200);
    assert.equal(
      media.headers.get("cache-control"),
      "public, max-age=31536000, immutable",
    );

    const head = await fetch(`${baseUrl}/readyz`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  });

  it("returns 503 readiness for a missing build or referenced asset", async () => {
    const missingBuild = await listen(
      createApp({ distDir: path.join(fixtureRoot, "not-built") }),
    );
    const missingBuildResponse = await fetch(`${missingBuild}/readyz`);
    assert.equal(missingBuildResponse.status, 503);
    assert.deepEqual(await missingBuildResponse.json(), {
      ok: false,
      status: "not_ready",
      code: "static_build_unavailable",
    });

    const missingAssetDist = writeFixture({ missingAsset: true });
    const missingAsset = await listen(createApp({ distDir: missingAssetDist }));
    const missingAssetResponse = await fetch(`${missingAsset}/readyz`);
    assert.equal(missingAssetResponse.status, 503);
    assert.deepEqual(await missingAssetResponse.json(), {
      ok: false,
      status: "not_ready",
      code: "static_build_unavailable",
    });
  });

  it("scans immutable static readiness once across repeated GET/HEAD probes", async () => {
    const distDir = writeFixture();
    let scanCount = 0;
    const app = createApp({
      distDir,
      readinessCheck: (options) => {
        scanCount += 1;
        return validateStaticBuild(options);
      },
    });
    const baseUrl = await listen(app);
    fs.rmSync(path.join(distDir, "assets", "site.js"));

    const responses = await Promise.all([
      fetch(`${baseUrl}/readyz`),
      fetch(`${baseUrl}/readyz`, { method: "HEAD" }),
      fetch(`${baseUrl}/readyz`),
      fetch(`${baseUrl}/readyz`, { method: "HEAD" }),
      fetch(`${baseUrl}/healthz`),
    ]);

    assert.equal(scanCount, 1);
    assert.deepEqual(
      responses.slice(0, 4).map((response) => response.status),
      [200, 200, 200, 200],
    );
  });
});

describe("sanitized errors and canonical redirects", () => {
  it("redirects only the known website Railway host by default, preserving public and backend traffic", async () => {
    const base = await listen(createApp({ distDir: writeFixture(), canonicalOrigin: null }));
    const railway = "workspaceworks-website-production.up.railway.app";
    // Node fetch can replace Host with the URL authority. Use raw HTTP here
    // to exercise the same virtual-host routing Railway presents to Express.
    const hostRequest = (url, options = {}) => new Promise((resolve, reject) => {
      const request = http.request(url, options, (response) => {
        response.resume();
        response.on("end", () => resolve({
          status: response.statusCode,
          headers: new Headers(response.headers),
        }));
      });
      request.on("error", reject);
      request.end(options.body);
    });
    for (const method of ["GET", "HEAD"]) {
      const response = await hostRequest(`${base}/en/blog/example?ref=a%20b`, {
        method, headers: { host: railway }, redirect: "manual",
      });
      assert.equal(response.status, 308);
      assert.equal(response.headers.get("location"), "https://www.worksdot.hu/en/blog/example?ref=a%20b");
      assert.match(response.headers.get("cache-control"), /no-store/);
    }
    for (const host of ["www.worksdot.hu", "localhost", "unknown.example"]) {
      const response = await hostRequest(`${base}/`, { headers: { host, "x-forwarded-host": railway }, redirect: "manual" });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-robots-tag"), null);
      assert.equal(response.headers.get("location"), null);
    }
    for (const route of ["/healthz", "/readyz", "/api/unknown", "/strapi/unknown", "/media/test-abc123.webp", "/assets/site.js", "/uploads/unknown"]) {
      const response = await hostRequest(base + route, { headers: { host: railway }, redirect: "manual" });
      assert.equal(response.headers.get("location"), null, route);
    }
    const post = await hostRequest(`${base}/api/contact/send`, { method: "POST", headers: { host: railway, "content-type": "application/json" }, body: "{", redirect: "manual" });
    assert.equal(post.status, 400);
    assert.equal(post.headers.get("location"), null);
    assert.throws(() => createApp({ distDir: writeFixture(), canonicalOrigin: `https://${railway}` }), /must not point to a Railway/);
  });

  it("bounds provider operations without exposing provider details", async () => {
    await assert.rejects(
      withTimeout(
        () => new Promise(() => {}),
        5,
      ),
      ProviderTimeoutError,
    );
  });

  it("returns sanitized JSON for malformed API bodies", async () => {
    const baseUrl = await listen(createApp({ distDir: writeFixture() }));
    const response = await fetch(`${baseUrl}/api/contact/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      code: "invalid_request",
    });
  });

  it("preserves path and query, ignores forwarded host, and bypasses probes", async () => {
    const canonicalOrigin = "https://canonical.example.test";
    const app = createApp({
      distDir: writeFixture(),
      canonicalOrigin,
    });
    const baseUrl = await listen(app);

    const redirected = await fetch(`${baseUrl}/en/projects?utm=health`, {
      headers: {
        host: "untrusted.example.test",
        "x-forwarded-host": "canonical.example.test",
      },
      redirect: "manual",
    });
    assert.equal(redirected.status, 308);
    assert.equal(
      redirected.headers.get("location"),
      "https://canonical.example.test/en/projects?utm=health",
    );

    const health = await fetch(`${baseUrl}/healthz`, {
      headers: { host: "untrusted.example.test" },
    });
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, status: "alive" });
  });

  it("validates canonical settings and never emits an untrusted redirect origin", () => {
    assert.equal(parseCanonicalOrigin(undefined), null);
    assert.equal(parseCanonicalOrigin(""), null);
    assert.equal(parseCanonicalOrigin("https://example.test/"), "https://example.test");
    assert.equal(
      parseCanonicalOrigin("http://localhost:8080/"),
      "http://localhost:8080",
    );
    assert.throws(() => parseCanonicalOrigin("https://example.test/path"));
    assert.throws(() => parseCanonicalOrigin("https://example.test/foo/.."));
    assert.throws(() => parseCanonicalOrigin("https://user:pass@example.test"));
    assert.throws(() => parseCanonicalOrigin("https://@example.test"));
    assert.throws(() => parseCanonicalOrigin("https://example.test?utm=launch"));
    assert.throws(() => parseCanonicalOrigin("https://example.test#section"));
    assert.throws(() => parseCanonicalOrigin("http://example.test"));
    assert.throws(() => parseCanonicalOrigin("ftp://example.test"));

    assert.equal(
      canonicalRedirectLocation(
        { originalUrl: "/\\evil.example.test/?x=1" },
        "https://canonical.example.test",
      ),
      "https://canonical.example.test/",
    );
  });
});