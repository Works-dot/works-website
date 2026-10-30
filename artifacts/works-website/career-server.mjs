import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isOpenJob, jobFields, jobLocationLabel, jobTypeLabel } from "./src/lib/job-posting.js";
import { mapContentBlocks } from "./src/lib/content-blocks.js";

export async function readLiveJobs(base, locale, fetcher = fetch) {
  if (!base) throw new Error("Career CMS origin is not configured");
  const result = [];
  for (let page = 1; ; page++) {
    const url = new URL(`${base.replace(/\/$/, "")}/strapi/api/career-positions`);
    const params = {
      locale, status: "published", "filters[isActive][$eq]": "true",
      "pagination[pageSize]": "100", "pagination[page]": String(page),
      "populate[0]": "tags", "populate[1]": "contentBlocks.image", "populate[2]": "seo.ogImage",
    };
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetcher(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!response.ok) throw new Error(`Career CMS unavailable (${response.status})`);
    const payload = await response.json();
    if (!Array.isArray(payload.data)) throw new Error("Invalid career response");
    result.push(...payload.data.filter(c => c.isActive === true && isOpenJob(c)).map(c => ({
      ...jobFields(c), documentId: c.documentId, publishedAt: c.publishedAt,
      slug: c.slug, title: c.title, team: c.team || "", excerpt: c.excerpt || "",
      location: jobLocationLabel(c), type: jobTypeLabel(c.employmentType, locale),
      tags: (c.tags || []).map(t => t.name), content: mapContentBlocks(c.contentBlocks),
      seo: c.seo ? { metaTitle: c.seo.metaTitle, metaDescription: c.seo.metaDescription, ogImage: c.seo.ogImage?.url } : null,
    })));
    if (page >= (payload.meta?.pagination?.pageCount || 1)) break;
    if (page >= 100) throw new Error("Career pagination limit exceeded");
  }
  return result;
}

export function careerPath(value) {
  let pathname;
  try { pathname = decodeURIComponent(value).replace(/\/index\.html$/, "").replace(/\/+$/, ""); } catch { return null; }
  const match = pathname.match(/^\/(karrier|en\/careers)(?:\/([^/]+))?$/);
  return match ? { locale: match[1] === "karrier" ? "hu" : "en", slug: match[2], pathname } : null;
}

// No successful-response TTL: withdrawal/expiry must not wait for a build.
// Coalesce concurrent reads only. Failed reads are never treated as empty lists.
export function careerMiddleware({ distDir, readJobs, renderer } = {}) {
  let inFlight;
  const snapshot = () => {
    if (!inFlight) inFlight = Promise.all(["hu", "en"].map(readJobs)).then(([hu, en]) => ({ hu, en }))
      .finally(() => { inFlight = undefined; });
    return inFlight;
  };
  return async (req, res, next) => {
    if (!["GET", "HEAD"].includes(req.method)) return next();
    const route = careerPath(req.path);
    if (!route && req.path !== "/sitemap.xml") return next();
    res.setHeader("Cache-Control", "no-store");
    try {
      const jobs = await snapshot();
      if (!route) {
        const xml = fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8");
        return res.type("application/xml").send(xml.replace(/<url>[\s\S]*?<\/url>/g, block => {
          const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
          const jobRoute = loc ? careerPath(new URL(loc).pathname) : null;
          return jobRoute?.slug && !jobs[jobRoute.locale].some(j => j.slug === jobRoute.slug && isOpenJob(j)) ? "" : block;
        }));
      }
      if (route.slug && !jobs[route.locale].some(j => j.slug === route.slug && isOpenJob(j))) {
        res.setHeader("X-Robots-Tag", "noindex");
        return res.status(404).type("html").send(fs.readFileSync(path.join(distDir, "404.html"), "utf8"));
      }
      const render = renderer || (await import(pathToFileURL(path.resolve(distDir, "../server/entry-server.js")).href)).renderCareer;
      const { html, head } = render(route.pathname, jobs);
      const data = JSON.stringify(jobs).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
      const template = fs.readFileSync(path.resolve(distDir, "../career-template.html"), "utf8");
      return res.type("html").send(template
        .replace("<!--ssr-head-->", () => head + `<script>window.__CAREER_JOBS__=${data};</script>`)
        .replace("<!--ssr-outlet-->", () => html)
        .replace(/<html(\s[^>]*)?\slang=(["'])[^"']*\2([^>]*)>/i, `<html$1 lang="${route.locale}"$3>`));
    } catch (error) {
      console.error("Career freshness check failed:", error instanceof Error ? error.message : "unknown");
      res.setHeader("Retry-After", "60");
      return res.status(503).type("text").send("Az álláshirdetések átmenetileg nem érhetők el. / Job listings are temporarily unavailable.");
    }
  };
}
