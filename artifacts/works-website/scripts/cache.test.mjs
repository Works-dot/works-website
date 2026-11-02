import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { prepareCache, safeAssetUrl } from "./prepare-cache.mjs";
import { createApp } from "../server.mjs";
import { HTML_CACHE, IMMUTABLE_CACHE } from "../cache-policy.mjs";

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "works-cache-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  for (const [name, text] of Object.entries({
    "index.html": "<html><body>HU</body></html>",
    "en/index.html": "<html><body>EN</body></html>",
    "404.html": "<html><body>not found</body></html>",
    "assets/main-AbCd1234.js": "console.log('version one')",
    "assets/font-AbCd1234.woff2": "font",
    "assets/style-AbCd1234.css": "body{}",
    "assets/unhashed.svg": "<svg/>",
    "media/originals/logo-abcdef0123456789.svg": "<svg/>",
    "favicon.svg": "<svg/>",
  })) {
    await fs.mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await fs.writeFile(path.join(dir, name), text);
  }
  return dir;
}

test("HTTP cache policy: HTML, immutable allowlist, redirects, APIs and errors", async t => {
  const dir = await fixture(t);
  const manifest = await prepareCache({ distDir: dir });
  const server = createApp({ distDir: dir, readinessCheck: () => ({ ok: true }) }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const url of ["/", "/en", "/en/", "/en/index.html"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(base + url, { method });
      assert.equal(response.status, 200, url);
      assert.equal(response.headers.get("cache-control"), HTML_CACHE, url);
    }
  }
  for (const asset of manifest.assets) {
    const response = await fetch(base + asset.url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), IMMUTABLE_CACHE);
  }
  const redirect = await fetch(base + "/favicon.svg", { redirect: "manual" });
  assert.equal(redirect.status, 307);
  assert.equal(redirect.headers.get("cache-control"), "no-cache");
  assert.match(redirect.headers.get("location"), /^\/static\/[a-f0-9]{64}\/favicon.svg$/);
  // Adding a file to assets must not automatically make it immutable.
  await fs.writeFile(path.join(dir, "assets/new.js"), "new");
  assert.equal((await fetch(base + "/assets/new.js")).headers.get("cache-control"), "no-cache");
  for (const url of ["/missing", "/assets/missing.js", "/media/og/missing.jpg", "/asset-cache.json", "/healthz", "/readyz", "/karrier/closed"]) {
    const response = await fetch(base + url);
    assert.match(response.headers.get("cache-control"), /no-store/, url);
    if (url.includes("missing")) assert.equal(response.status, 404);
  }
  const bad = await fetch(base + "/api/contact/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(bad.status, 400);
  assert.match(bad.headers.get("cache-control"), /no-store/);
  assert.match((await fetch(base + "/api/contact/send", { method: "OPTIONS" })).headers.get("cache-control"), /no-store/);
  const first = await fetch(base + "/");
  const conditional = await fetch(base + "/", { headers: { "If-None-Match": first.headers.get("etag"), "Cache-Control": "max-age=0" } });
  assert.equal(conditional.status, 304);
  assert.equal(conditional.headers.get("cache-control"), HTML_CACHE);
});

test("public URL changes with bytes; prior deployment assets survive missing local files", async t => {
  const dir = await fixture(t);
  const first = await prepareCache({ distDir: dir, now: 1000 });
  const old = first.redirects["/favicon.svg"];
  const priorBytes = new Map(await Promise.all(first.assets.map(async asset =>
    [asset.url, await fs.readFile(path.join(dir, asset.url))])));
  await fs.rm(path.join(dir, "static"), { recursive: true });
  await fs.rm(path.join(dir, "assets/main-AbCd1234.js"));
  await fs.writeFile(path.join(dir, "favicon.svg"), "<svg>changed</svg>");
  const fetcher = async url => new Response(new URL(url).pathname === "/asset-cache.json"
    ? JSON.stringify(first) : priorBytes.get(new URL(url).pathname), { status: 200 });
  const second = await prepareCache({ distDir: dir, previousOrigin: "https://previous.example", fetcher, now: 2000 });
  assert.notEqual(second.redirects["/favicon.svg"], old);
  assert.equal(await fs.readFile(path.join(dir, old), "utf8"), "<svg/>");
  assert.equal(await fs.readFile(path.join(dir, "assets/main-AbCd1234.js"), "utf8"), "console.log('version one')");
  assert.equal(second.assets.find(a => a.url === old).retainUntil, 2000 + 86400000);
});

test("previous release failure, corruption and unsafe paths stop the build", async t => {
  const dir = await fixture(t);
  const asset = { url: "/assets/old-AbCd1234.js", bytes: 3, sha256: createHash("sha256").update("old").digest("hex") };
  await assert.rejects(prepareCache({ distDir: dir, previousOrigin: "https://previous.example", fetcher: async () => new Response("", { status: 503 }) }), /503/);
  await assert.rejects(prepareCache({ distDir: dir, previousOrigin: "https://previous.example", fetcher: async url =>
    new Response(new URL(url).pathname === "/asset-cache.json" ? JSON.stringify({ version: 1, assets: [asset] }) : "bad") }), /integrity/);
  for (const value of ["/assets/../secret.js", "/assets/%2e%2e/secret.js", "https://elsewhere.test/a.js", "/assets/a\\b.js", "/api/send"]) {
    assert.equal(safeAssetUrl(value), false);
  }
});

test("bootstrap only accepts a previous no-cache deployment", async t => {
  const dir = await fixture(t);
  const fetcher = cache => async url => new URL(url).pathname === "/asset-cache.json"
    ? new Response("", { status: 404 })
    : new Response("", { headers: { "Cache-Control": cache } });
  await assert.rejects(prepareCache({ distDir: dir, previousOrigin: "https://previous.example",
    fetcher: fetcher("public, max-age=60") }), /unsafe bootstrap/);
  await prepareCache({ distDir: dir, previousOrigin: "https://previous.example", fetcher: fetcher("no-cache") });
});
