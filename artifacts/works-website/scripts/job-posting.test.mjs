import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { isOpenJob, jobSchema, jobIso } from "../src/lib/job-posting.js";
import { careerMiddleware, readLiveJobs } from "../career-server.mjs";

const job = { slug: "test", title: "Researcher", excerpt: "Research", publishedAt: "2026-01-01T00:00:00Z",
  originalPublishedAt: "2025-01-01T00:00:00Z", validThrough: "2099-01-01T00:00:00Z",
  employmentType: "FULL_TIME", addressLocality: "Budapest", addressCountry: "HU", isActive: true };
test("complete schema, strict dates, expiry and withdrawal", () => {
  const schema = jobSchema(job, { url: "https://example.test/karrier/test", locale: "hu", organization: { "@id": "#organization" } });
  assert.equal(schema.datePosted, "2025-01-01T00:00:00.000Z");
  assert.equal(schema.jobLocation.address.addressCountry, "HU");
  assert.equal(jobIso("2026-02-30T00:00:00Z"), null);
  assert.equal(jobIso("2026-01-01"), null);
  for (const patch of [{ isActive: false }, { publishedAt: null }, { validThrough: "2020-01-01T00:00:00Z" }])
    assert.equal(isOpenJob({ ...job, ...patch }), false);
  assert.equal(jobSchema({ ...job, employmentType: null }, { url: "", locale: "hu", organization: {} }), null);
});
test("real HTTP: fresh HU/EN pages, closed/expired 404, failure 503, filtered sitemap", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "career-test-"));
  const dist = path.join(root, "public"); fs.mkdirSync(dist);
  fs.writeFileSync(path.join(dist, "404.html"), "<h1>Not found</h1>");
  fs.writeFileSync(path.join(root, "career-template.html"), '<html lang="hu"><head><!--ssr-head--></head><body><!--ssr-outlet--></body></html>');
  fs.writeFileSync(path.join(dist, "sitemap.xml"), '<urlset><url><loc>https://example.test/karrier/test</loc></url><url><loc>https://example.test/en/careers/test</loc></url></urlset>');
  let rows = [job], fail = false;
  const app = express();
  app.use(careerMiddleware({ distDir: dist, readJobs: async () => { if (fail) throw Error("offline"); return rows; },
    renderer: () => ({ html: "<h1>Researcher</h1>", head: '<script type="application/ld+json">{"@type":"JobPosting"}</script>' }) }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ["/karrier/test", "/en/careers/test", "/karrier/test/index.html", "/karrier/%74est/"]) {
      assert.equal((await fetch(base + route)).status, 200);
      rows = []; let response = await fetch(base + route);
      assert.equal(response.status, 404); assert.doesNotMatch(await response.text(), /JobPosting/);
      rows = [{ ...job, validThrough: "2020-01-01T00:00:00Z" }];
      assert.equal((await fetch(base + route)).status, 404);
      rows = [job];
    }
    rows = [];
    assert.doesNotMatch(await (await fetch(base + "/sitemap.xml")).text(), /<loc>/);
    fail = true;
    assert.equal((await fetch(base + "/karrier/test")).status, 503);
    assert.equal((await fetch(base + "/karrier")).status, 503);
  } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(root, { recursive: true }); }
});
test("live mapping cannot mistake unpublished, inactive or expired jobs for open jobs", async () => {
  const jobs = await readLiveJobs("https://example.test", "hu", async () => ({ ok: true, json: async () => ({
    data: [job, { ...job, publishedAt: null }, { ...job, isActive: false }, { ...job, validThrough: "2020-01-01T00:00:00Z" }],
  }) }));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].employmentType, "FULL_TIME");
});
