import fs from "node:fs";
import path from "node:path";

export const LEGACY_ORIGIN = "https://www.worksdot.hu";
// Approved first two CSV columns; the two legal destinations were explicitly
// changed by the owner to the current CMS imprint PDF.
export const LEGACY_PATHS = {
  "/user-research": "/szolgaltatasok/ux-kutatas",
  "/ux-ui-design": "/szolgaltatasok/ux-ui-design",
  "/service-design": "/szolgaltatasok/service-design",
  "/accessibility-audit": "/szolgaltatasok/akadalymentesites",
  "/customer-centric-design-workshop": "/szolgaltatasok/digitalis-kepessegfejlesztes",
  "/usability-training": "/szolgaltatasok/digitalis-kepessegfejlesztes",
  "/strategic-planning": "/szolgaltatasok/service-design",
  "/services": "/",
  "/about": "/rolunk",
  "/contact": "/kapcsolat",
  "/references": "/projektek",
  "/vacancies": "/karrier",
  "/imprint": null,
  "/privacy-statement": "/adatkezeles",
  "/privacy-policy": "/adatkezeles",
  "/terms": null,
  "/ux-researcher": "/karrier",
  "/ui-designer": "/karrier",
  "/digital-product-designer": "/karrier",
  "/designers": "/karrier",
  "/portfolio-dani": "/karrier",
  "/portfolio-joci": "/karrier",
  "/portfolio-kriszti": "/karrier",
  "/portfolio-peti": "/karrier",
  "/portfolio-zoli": "/karrier",
  "/portfolio-zsofi": "/karrier",
  "/home": "/",
  "/references-v4": "/projektek",
  "/blog-1": "/blog",
};

export function buildLegacyRedirects(imprintPdfUrl) {
  if (typeof imprintPdfUrl !== "string" || !imprintPdfUrl.trim() ||
      imprintPdfUrl.includes("\\") || imprintPdfUrl.startsWith("//")) {
    throw new Error("Legacy redirects require the current CMS imprint PDF URL");
  }
  const pdf = new URL(imprintPdfUrl, LEGACY_ORIGIN);
  if (pdf.protocol !== "https:" || pdf.username || pdf.password ||
      !pdf.pathname.toLowerCase().endsWith(".pdf") || pdf.hash) {
    throw new Error("Invalid CMS imprint PDF URL for legacy redirects");
  }
  return Object.fromEntries(Object.entries(LEGACY_PATHS).map(([source, target]) =>
    [source, target === null ? pdf.href : new URL(target, LEGACY_ORIGIN).href]));
}

export function readLegacyRedirects(distDir) {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(distDir, "..", "legacy-redirects.json"), "utf8"));
  const expected = buildLegacyRedirects(manifest["/imprint"]);
  if (JSON.stringify(Object.entries(manifest).sort()) !==
      JSON.stringify(Object.entries(expected).sort())) {
    throw new Error("Legacy redirect manifest does not match approved routes; rebuild");
  }
  return expected;
}

export function addLegacyRedirects(app, redirects) {
  if (!redirects) return;
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const source = req.path.endsWith("/") ? req.path.slice(0, -1) : req.path;
    if (!Object.hasOwn(redirects, source)) return next();
    const target = new URL(redirects[source]);
    const queryIndex = req.originalUrl.indexOf("?");
    if (queryIndex !== -1) {
      const query = req.originalUrl.slice(queryIndex + 1);
      target.search = target.search ? `${target.search}&${query}` : query;
    }
    res.status(301).setHeader("Location", target.href);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end();
  });
}