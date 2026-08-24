import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist", "public");
const siteUrl = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  "https://workspaceworks-website-production.up.railway.app"
).replace(/\/+$/, "");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      assert(address && typeof address === "object");
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForServer(url, child, output) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `Production server exited with code ${child.exitCode}.\n${output.join("")}`,
      );
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Production server did not become ready at ${url}.\n${output.join("")}`);
}

function findBlogSlugs() {
  const blogDir = path.join(distDir, "blog");
  assert.ok(fs.existsSync(blogDir), "The prerendered blog directory is missing");

  const slugs = fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(blogDir, entry.name, "index.html")),
    )
    .map((entry) => entry.name)
    .sort();

  assert.ok(slugs.length >= 2, "At least two prerendered blog posts are required");
  return slugs;
}

async function assertPrerenderedResponse(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  assert.equal(response.status, 200, `${pathname} should be served successfully`);

  const html = await response.text();
  assert.ok(
    !html.includes("<!--ssr-outlet-->"),
    `${pathname} still contains the unused SSR outlet`,
  );
  assert.match(
    html,
    /<div id="root">[\s\S]*<main[\s>]/,
    `${pathname} does not contain prerendered page content`,
  );
  assert.match(
    html,
    /<script[^>]+type="module"[^>]+src="[^"]*\/assets\/[^"]+\.js"/,
    `${pathname} does not load the production JavaScript bundle`,
  );
}

async function assertRenderedPage(page, expectedPath) {
  await page.waitForURL((url) => url.pathname === expectedPath);
  await page.locator("main").waitFor({ state: "visible" });

  await page.waitForFunction(() => {
    const main = document.querySelector("main");
    return Boolean(
      main &&
        (main.textContent?.trim().length || 0) > 30 &&
        main.getBoundingClientRect().height > 100,
    );
  });

  const bodyText = (await page.locator("body").innerText()).trim();
  assert.ok(bodyText.length > 100, `${expectedPath} rendered an effectively empty page`);
}

async function readSeo(page) {
  return page.evaluate(() => {
    const contents = (selector) =>
      Array.from(document.head.querySelectorAll(selector)).map((element) =>
        element.getAttribute("content"),
      );
    const hrefs = (selector) =>
      Array.from(document.head.querySelectorAll(selector)).map((element) =>
        element.getAttribute("href"),
      );

    return {
      titles: Array.from(document.head.querySelectorAll("title")).map(
        (element) => element.textContent,
      ),
      descriptions: contents('meta[name="description"]'),
      canonicals: hrefs('link[rel="canonical"]'),
      ogTitles: contents('meta[property="og:title"]'),
      ogDescriptions: contents('meta[property="og:description"]'),
      ogTypes: contents('meta[property="og:type"]'),
      ogUrls: contents('meta[property="og:url"]'),
      publishedTimes: contents('meta[property="article:published_time"]'),
    };
  });
}

function assertSingleton(values, label, { allowEmpty = false } = {}) {
  assert.equal(values.length, 1, `Expected one ${label}, found ${values.length}`);
  if (!allowEmpty) {
    assert.ok(values[0], `${label} must not be empty`);
  }
}

async function assertSeo(page, { pathname, type, articleTitle }) {
  await page.waitForFunction(
    ({ expectedCanonical, expectedType, expectedTitle }) => {
      const canonical = document.head.querySelector('link[rel="canonical"]')?.href;
      const ogType = document.head.querySelector('meta[property="og:type"]')?.content;
      return (
        canonical === expectedCanonical &&
        ogType === expectedType &&
        (!expectedTitle || document.title.includes(expectedTitle))
      );
    },
    {
      expectedCanonical: `${siteUrl}${pathname}`,
      expectedType: type,
      expectedTitle: articleTitle || "",
    },
  );

  const seo = await readSeo(page);
  assertSingleton(seo.titles, "title");
  assertSingleton(seo.descriptions, "meta description", { allowEmpty: true });
  assertSingleton(seo.canonicals, "canonical link");
  assertSingleton(seo.ogTitles, "og:title");
  assertSingleton(seo.ogDescriptions, "og:description", { allowEmpty: true });
  assertSingleton(seo.ogTypes, "og:type");
  assertSingleton(seo.ogUrls, "og:url");
  assert.equal(seo.canonicals[0], `${siteUrl}${pathname}`);
  assert.equal(seo.ogUrls[0], `${siteUrl}${pathname}`);
  assert.equal(seo.ogTypes[0], type);
  assert.equal(seo.ogTitles[0], seo.titles[0]);
  assert.equal(seo.ogDescriptions[0], seo.descriptions[0]);

  if (type === "article") {
    assertSingleton(seo.publishedTimes, "article:published_time");
  } else {
    assert.equal(
      seo.publishedTimes.length,
      0,
      `${pathname} retained stale article publication metadata`,
    );
  }

  return seo;
}

async function clickHeaderLink(page, href) {
  const link = page.locator(`header nav[aria-label] a[href="${href}"]`).first();
  await link.click();
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) =>
      setTimeout(() => {
        if (child.exitCode === null) child.kill("SIGKILL");
        resolve();
      }, 2_000),
    ),
  ]);
}

async function run() {
  assert.ok(fs.existsSync(distDir), "Production build is missing; run the build first");
  const blogSlugs = findBlogSlugs();
  const firstArticlePath = `/blog/${blogSlugs[0]}`;

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const serverOutput = [];
  const server = spawn(process.execPath, ["server.mjs"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      STRAPI_URL: "http://127.0.0.1:9",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

  let browser;
  try {
    await waitForServer(baseUrl, server, serverOutput);
    await assertPrerenderedResponse(baseUrl, "/");
    await assertPrerenderedResponse(baseUrl, firstArticlePath);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const browserFailures = [];

    page.on("pageerror", (error) => {
      browserFailures.push(`pageerror: ${error.stack || error.message}`);
    });
    page.on("requestfailed", (request) => {
      if (request.resourceType() === "script") {
        browserFailures.push(
          `failed script request: ${request.url()} (${request.failure()?.errorText || "unknown"})`,
        );
      }
    });
    page.on("response", (response) => {
      if (response.request().resourceType() === "script" && response.status() >= 400) {
        browserFailures.push(
          `script request returned ${response.status()}: ${response.url()}`,
        );
      }
    });

    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await assertRenderedPage(page, "/");
    await page.locator('section#projects a[href="/projektek"]').click();
    await assertRenderedPage(page, "/projektek");
    await assertSeo(page, { pathname: "/projektek", type: "website" });

    await page.goto(`${baseUrl}${firstArticlePath}`, { waitUntil: "networkidle" });
    await assertRenderedPage(page, firstArticlePath);
    const firstTitle = (await page.locator("main h1").first().innerText()).trim();
    const firstSeo = await assertSeo(page, {
      pathname: firstArticlePath,
      type: "article",
      articleTitle: firstTitle,
    });

    await clickHeaderLink(page, "/projektek");
    await assertRenderedPage(page, "/projektek");
    const projectsSeo = await assertSeo(page, {
      pathname: "/projektek",
      type: "website",
    });
    assert.notEqual(projectsSeo.titles[0], firstSeo.titles[0]);

    await clickHeaderLink(page, "/blog");
    await assertRenderedPage(page, "/blog");
    await assertSeo(page, { pathname: "/blog", type: "website" });

    const nextArticleLink = page
      .locator(`main a[href^="/blog/"]:not([href="${firstArticlePath}"])`)
      .first();
    const nextArticlePath = await nextArticleLink.getAttribute("href");
    assert.ok(nextArticlePath?.startsWith("/blog/"), "A second blog article link is missing");
    await nextArticleLink.click();
    await assertRenderedPage(page, nextArticlePath);

    const nextTitle = (await page.locator("main h1").first().innerText()).trim();
    assert.notEqual(nextTitle, firstTitle, "The navigation did not open a different article");
    const nextSeo = await assertSeo(page, {
      pathname: nextArticlePath,
      type: "article",
      articleTitle: nextTitle,
    });
    assert.notEqual(
      nextSeo.titles[0],
      firstSeo.titles[0],
      "The second article retained the first article title",
    );
    assert.notEqual(
      nextSeo.canonicals[0],
      firstSeo.canonicals[0],
      "The second article retained the first article canonical URL",
    );

    assert.deepEqual(
      browserFailures,
      [],
      `Browser failures detected:\n${browserFailures.join("\n")}`,
    );

    console.log("✓ Production prerender and client navigation regression test passed");
  } finally {
    await browser?.close();
    await stopServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});