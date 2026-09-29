import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { addLegacyRedirects, readLegacyRedirects } from "./legacy-redirects.mjs";
import { pendingLegalRedirect } from "./legal-redirects.mjs";
import { subscribeNewsletter } from "./newsletter-server.mjs";
import { sendContactMessage } from "./contact-server.mjs";
import {
  classifyBodyParserError,
  sendSanitizedError,
} from "./server-error.mjs";
import {
  checkStaticReadiness,
  validateCanonicalSetting,
} from "./server-health.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST_DIR = path.join(__dirname, "dist", "public");

const API_ALLOWED_ORIGINS = new Set([
  "https://works.hu",
  "https://www.works.hu",
  "https://workspaceworks-website-production.up.railway.app",
  "https://works-website.replit.app",
]);

function configuredPort() {
  const rawPort = process.env.PORT;
  if (rawPort === undefined || rawPort === "") return 8080;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error("Invalid PORT value");
  }
  return port;
}

/**
 * CANONICAL_ORIGIN is intentionally opt-in and independent from SITE_URL,
 * which only configures SEO metadata. It is an origin, not an arbitrary URL:
 * deployed values must use HTTPS; HTTP is allowed only for loopback
 * development hosts. Paths, credentials, query strings, and hashes are
 * rejected.
 */
export function parseCanonicalOrigin(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid CANONICAL_ORIGIN value");
  if (value.trim() === "") return null;

  let origin;
  try {
    const trimmed = value.trim();
    const scheme = trimmed.match(/^[a-z][a-z\d+.-]*:\/\//i);
    const authorityAndPath = scheme
      ? trimmed.slice(scheme[0].length)
      : "";
    const authorityEnd = authorityAndPath.search(/[/?#]/);
    const authority =
      authorityEnd === -1
        ? authorityAndPath
        : authorityAndPath.slice(0, authorityEnd);
    const firstSlash = authorityAndPath.indexOf("/");
    const url = new URL(trimmed);
    const isLoopbackHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(
        url.hostname.toLowerCase(),
      );
    if (
      (!(
        url.protocol === "https:" ||
        (url.protocol === "http:" && isLoopbackHttp)
      )) ||
      authority.includes("@") ||
      url.username ||
      url.password ||
      value.includes("\\") ||
      !scheme ||
      (firstSlash !== -1 && authorityAndPath.slice(firstSlash) !== "/") ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("invalid origin");
    }
    origin = url.origin;
  } catch {
    throw new Error("Invalid CANONICAL_ORIGIN value");
  }

  if (validateCanonicalSetting(origin) !== origin) {
    throw new Error("Invalid CANONICAL_ORIGIN value");
  }
  return origin;
}

function setNoStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function setApiCors(req, res) {
  const origin = req.get("origin");
  if (origin && API_ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
}

function requestHost(req) {
  // Do not use X-Forwarded-Host.  The redirect target is fixed by the
  // explicitly validated CANONICAL_ORIGIN setting.
  return typeof req.get("host") === "string" ? req.get("host").toLowerCase() : "";
}

export function canonicalRedirectLocation(req, canonicalOrigin) {
  if (!canonicalOrigin) return null;

  const rawUrl = typeof req.originalUrl === "string" ? req.originalUrl : "/";
  const requestTarget =
    rawUrl.startsWith("/") && !rawUrl.startsWith("//") ? rawUrl : "/";

  try {
    const target = new URL(requestTarget, `${canonicalOrigin}/`);
    // URL treats some backslash forms as authority separators.  Refuse those
    // forms rather than ever emitting an untrusted redirect destination.
    if (target.origin !== canonicalOrigin) return `${canonicalOrigin}/`;
    return target.toString();
  } catch {
    return `${canonicalOrigin}/`;
  }
}

function addCanonicalRedirect(app, canonicalOrigin) {
  if (canonicalOrigin && new URL(canonicalOrigin).hostname.endsWith(".railway.app")) {
    throw new Error("CANONICAL_ORIGIN must not point to a Railway infrastructure hostname");
  }

  app.use((req, res, next) => {
    // Match the actual Host only. Forwarded host is untrusted and can cause
    // redirect loops through reverse proxies or poison shared cache entries.
    const knownWebsiteHost = requestHost(req) === "workspaceworks-website-production.up.railway.app";
    const targetOrigin = knownWebsiteHost ? "https://www.worksdot.hu" : canonicalOrigin;
    if (
      !targetOrigin ||
      (req.method !== "GET" && req.method !== "HEAD") ||
      req.path === "/healthz" ||
      req.path === "/readyz" ||
      ["/api", "/strapi", "/uploads", "/assets", "/media"].some(
        (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
      )
    ) {
      next();
      return;
    }

    if (requestHost(req) === new URL(targetOrigin).host.toLowerCase()) {
      next();
      return;
    }

    const location = canonicalRedirectLocation(req, targetOrigin);
    if (!location) {
      next();
      return;
    }
    res.vary("Host");
    setNoStore(res);
    res.status(308).setHeader("Location", location).end();
  });
}

function healthResponse(res, status, body) {
  setNoStore(res);
  res.status(status).json(body);
}

function addHealthRoutes(app, { readinessResult }) {
  const liveness = (_req, res) => {
    healthResponse(res, 200, { ok: true, status: "alive" });
  };

  const readiness = (_req, res) => {
    if (readinessResult.ok) {
      healthResponse(res, 200, { ok: true, status: "ready" });
      return;
    }

    // Do not expose filesystem paths, HTML, environment variables, or
    // provider details in health responses.
    healthResponse(res, 503, {
      ok: false,
      status: "not_ready",
      code: "static_build_unavailable",
    });
  };

  app.get("/healthz", liveness);
  app.head("/healthz", liveness);
  app.get("/readyz", readiness);
  app.head("/readyz", readiness);
}

function addApiRoutes(app) {
  app.options("/api/newsletter/subscribe", (req, res) => {
    setApiCors(req, res);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    setApiCors(req, res);
    const result = await subscribeNewsletter(req.body?.email);
    res.status(result.status).json(result.body);
  });

  app.options("/api/contact/send", (req, res) => {
    setApiCors(req, res);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
  });

  app.post("/api/contact/send", async (req, res) => {
    setApiCors(req, res);
    const result = await sendContactMessage(req.body);
    res.status(result.status).json(result.body);
  });
}

function addStaticRoutes(app, distDir) {
  const publicDir = path.resolve(distDir);
  const immutableDirectories = [
    `${path.join(publicDir, "assets")}${path.sep}`,
    `${path.join(publicDir, "media")}${path.sep}`,
  ];
  const strapiTarget = process.env.STRAPI_URL || process.env.STRAPI_PROXY_TARGET;
  if (strapiTarget) {
    app.use(
      createProxyMiddleware({
        pathFilter: (pathname) =>
          pathname === "/strapi" || pathname.startsWith("/strapi/"),
        target: strapiTarget,
        changeOrigin: true,
        xfwd: true,
      }),
    );
  }

  app.use(
    express.static(distDir, {
      extensions: ["html"],
      index: "index.html",
      redirect: false,
      setHeaders: (res, filePath) => {
        // A Vite hash assetjei (dist/public/assets/*) örökre cache-elhetők;
        // a generált, content-hashed média (dist/public/media/*) is;
        // a HTML és a generált sitemap/robots mindig revalidálódjon.
        if (immutableDirectories.some((directory) => filePath.startsWith(directory))) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (
          filePath.endsWith(".html") ||
          filePath.endsWith("sitemap.xml") ||
          filePath.endsWith("robots.txt")
        ) {
          res.setHeader("Cache-Control", "no-cache");
        } else {
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
      },
    }),
  );

  const notFoundPage = path.join(distDir, "404.html");
  app.get(/.*/, (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    const candidate = path.join(distDir, req.path, "index.html");
    res.sendFile(candidate, (error) => {
      if (!error) return;

      // Ismeretlen cím: 404-es státusz + 404-es oldal (ne a főoldal 200-zal).
      if (fs.existsSync(notFoundPage)) {
        res.status(404).sendFile(notFoundPage);
      } else {
        res.status(404).sendFile(path.join(distDir, "index.html"));
      }
    });
  });
}

export function createApp({
  distDir = DEFAULT_DIST_DIR,
  canonicalOrigin = parseCanonicalOrigin(process.env.CANONICAL_ORIGIN),
  readinessCheck = checkStaticReadiness,
  legacyRedirects = null,
} = {}) {
  const app = express();
  // The deployed dist is immutable for the lifetime of this process.  Scan
  // it once at startup so frequent Railway probes stay cheap and deterministic.
  const readinessResult = readinessCheck({ distDir, canonicalOrigin });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));
  addLegacyRedirects(app, legacyRedirects);
  app.use(pendingLegalRedirect);
  addCanonicalRedirect(app, canonicalOrigin);
  addHealthRoutes(app, { readinessResult });
  addApiRoutes(app);
  addStaticRoutes(app, distDir);

  // Express 5 forwards rejected async handlers here.  Keep parser errors and
  // all unexpected failures JSON and deliberately free of implementation
  // details.
  app.use((error, req, res, _next) => {
    setApiCors(req, res);
    const parserError = classifyBodyParserError(error);
    if (parserError) {
      sendSanitizedError(res, parserError.status, parserError.code);
      return;
    }
    sendSanitizedError(res);
  });

  return app;
}

export function startServer({
  port = configuredPort(),
  distDir = DEFAULT_DIST_DIR,
  canonicalOrigin = parseCanonicalOrigin(process.env.CANONICAL_ORIGIN),
} = {}) {
  const legacyRedirects = readLegacyRedirects(distDir);
  const app = createApp({ distDir, canonicalOrigin, legacyRedirects });

  if (!fs.existsSync(distDir)) {
    // Preserve the production startup contract: a deploy without its build
    // should fail rather than ever being considered healthy.  createApp()
    // remains injectable for readiness tests and local diagnostics.
    throw new Error("Static build not found; run the build step before starting the server");
  }

  return app.listen(port, "0.0.0.0", () => {
    console.log(`Works. website serving on :${port}`);
    console.log(`  static: ${distDir}`);
    console.log(
      process.env.STRAPI_URL || process.env.STRAPI_PROXY_TARGET
        ? "  proxy: /strapi/* enabled"
        : "  proxy: disabled",
    );
  });
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  startServer();
}