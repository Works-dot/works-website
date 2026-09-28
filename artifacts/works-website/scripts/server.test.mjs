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