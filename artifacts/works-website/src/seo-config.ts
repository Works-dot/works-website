/**
 * The SEO metadata origin used by both the browser bundle and the
 * server/prerender bundle. The public production origin is fixed below;
 * never infer it from the current host or the infrastructure hostname.
 *
 * This setting is deliberately separate from CANONICAL_ORIGIN. SITE_URL
 * controls generated metadata only; it does not enable server redirects.
 */
export const DEFAULT_SITE_URL = "https://www.worksdot.hu";

const LOCAL_HTTP_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function invalidSiteUrl(): Error {
  return new Error(
    "SITE_URL must be an HTTPS origin without credentials, path, query, or fragment",
  );
}

/**
 * Parse a strict origin for SEO metadata. HTTPS is required for deployed
 * origins; HTTP is accepted only for loopback development hosts.
 *
 * URL normalizes dot-segments in paths, so inspect the raw path before
 * reading url.pathname. This keeps values such as "/foo/.." from being
 * silently accepted as the root origin.
 */
function parseSiteOrigin(value: string): URL {
  if (typeof value !== "string") throw invalidSiteUrl();
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("\\")) throw invalidSiteUrl();

  const scheme = trimmed.match(/^[a-z][a-z\d+.-]*:\/\//i);
  if (!scheme) throw invalidSiteUrl();

  const authorityAndPath = trimmed.slice(scheme[0].length);
  const authorityEnd = authorityAndPath.search(/[/?#]/);
  const authority =
    authorityEnd === -1
      ? authorityAndPath
      : authorityAndPath.slice(0, authorityEnd);
  const firstSlash = authorityAndPath.indexOf("/");
  if (
    firstSlash !== -1 &&
    authorityAndPath.slice(firstSlash) !== "/"
  ) {
    throw invalidSiteUrl();
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw invalidSiteUrl();
  }

  const isHttps = url.protocol === "https:";
  const isLocalHttp =
    url.protocol === "http:" &&
    LOCAL_HTTP_HOSTNAMES.has(url.hostname.toLowerCase());
  if (
    (!isHttps && !isLocalHttp) ||
    authority.includes("@") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw invalidSiteUrl();
  }

  return url;
}

export function normalizeSiteUrl(value: string): string {
  return parseSiteOrigin(value).origin;
}

export function resolveSiteUrl(value?: string): string {
  if (value === undefined) return DEFAULT_SITE_URL;
  if (typeof value !== "string") throw invalidSiteUrl();
  if (value.trim() === "") return DEFAULT_SITE_URL;
  const origin = normalizeSiteUrl(value);
  if (new URL(origin).hostname.endsWith(".railway.app")) {
    throw new Error("SITE_URL must not use a Railway infrastructure hostname; use https://www.worksdot.hu");
  }
  return origin;
}