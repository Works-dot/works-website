export const PENDING_EN_LEGAL = {
  "/en/privacy": "/adatkezeles",
  "/en/cookies": "/sutik",
  "/en/imprint": "/impresszum",
};

// Shared by production Express and Vite; runs before canonical/static handling.
export function pendingLegalRedirect(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const url = new URL(req.originalUrl || req.url, "http://localhost");
  const target = PENDING_EN_LEGAL[url.pathname.replace(/\/+$/, "")];
  if (!target) return next();
  res.writeHead(302, {
    Location: target + url.search,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
  });
  res.end();
}