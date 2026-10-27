import { OLD_PROJECT_SLUG, PROJECT_SLUG } from "./src/lib/project-slug.js";

// Preserve the bytes/order/duplicates of all non-format query parameters.
export function normalizeRequestTarget(raw, redirects = {}) {
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  const index = raw.indexOf("?");
  let pathname = (index < 0 ? raw : raw.slice(0, index)).replace(/\/+$/, "") || "/";
  if (pathname === `/projektek/${OLD_PROJECT_SLUG}`) pathname = `/projektek/${PROJECT_SLUG}`;
  if (Object.hasOwn(redirects, pathname)) pathname = new URL(redirects[pathname]).pathname;
  const query = index < 0 ? "" : raw.slice(index + 1).split("&").filter(part => {
    try { return decodeURIComponent(part.split("=")[0].replace(/\+/g, " ")) !== "format"; }
    catch { return true; }
  }).join("&");
  return pathname + (query ? `?${query}` : "");
}

export function addUrlNormalization(app, canonicalOrigin, redirects) {
  app.use((req, res, next) => {
    if (!["GET", "HEAD"].includes(req.method) ||
        /^\/(?:api|strapi|uploads|assets|media)(?:\/|$)/.test(req.path) ||
        ["/healthz", "/readyz"].includes(req.path)) return next();
    const host = req.get("host")?.toLowerCase();
    const origin = ["worksdot.hu", "www.worksdot.hu",
      "workspaceworks-website-production.up.railway.app"].includes(host)
      ? "https://www.worksdot.hu" : canonicalOrigin;
    const raw = req.originalUrl;
    const normalized = normalizeRequestTarget(raw, redirects || {});
    const legacyPath = raw.split("?")[0].replace(/\/+$/, "") || "/";
    const legacy = redirects && Object.hasOwn(redirects, legacyPath);
    const hostChanged = origin && host !== new URL(origin).host;
    if (normalized === raw && !hostChanged && !legacy) return next();
    const targetOrigin = legacy ? new URL(redirects[legacyPath]).origin : (origin || "");
    res.vary("Host");
    res.setHeader("Cache-Control", "no-store");
    res.status(normalized !== raw || legacy ? 301 : 308)
      .setHeader("Location", targetOrigin + normalized).end();
  });
}
