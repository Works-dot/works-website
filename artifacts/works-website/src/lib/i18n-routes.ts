/**
 * i18n-routes.ts — Locale & routing foundation.
 *
 * Rules:
 *  - HU and EN are public locales.
 *  - HU paths remain exactly the current unprefixed paths (no /hu prefix).
 *  - EN paths use /en prefix with English segments.
 */

// ---------------------------------------------------------------------------
// Locale types
// ---------------------------------------------------------------------------

export type Locale = "hu" | "en";

/**
 * The locales that are publicly built and indexed.
 */
export const PUBLIC_LOCALES: readonly Locale[] = ["hu", "en"] as const;

export const DEFAULT_LOCALE: Locale = "hu";

/**
 * Locales whose route patterns are understood by the application runtime.
 * This is deliberately separate from PUBLIC_LOCALES: registering a pattern
 * does not make that locale public or include it in the sitemap/prerender.
 */
export const ROUTE_LOCALES: readonly Locale[] = ["hu", "en"] as const;

// ---------------------------------------------------------------------------
// Route segment maps
// ---------------------------------------------------------------------------

/** Maps canonical route keys to their HU path segments. */
const HU_SEGMENTS = {
  home: "/",
  projects: "/projektek",
  projectDetail: "/projektek/:slug",
  blog: "/blog",
  blogPost: "/blog/:slug",
  serviceDetail: "/szolgaltatasok/:slug",
  about: "/rolunk",
  contact: "/kapcsolat",
  careers: "/karrier",
  careerDetail: "/karrier/:slug",
  privacy: "/adatkezeles",
  cookies: "/sutik",
} as const;

/** Maps canonical route keys to their EN path segments. */
const EN_SEGMENTS = {
  home: "/en",
  projects: "/en/projects",
  projectDetail: "/en/projects/:slug",
  blog: "/en/blog",
  blogPost: "/en/blog/:slug",
  serviceDetail: "/en/services/:slug",
  about: "/en/about",
  contact: "/en/contact",
  careers: "/en/careers",
  careerDetail: "/en/careers/:slug",
  privacy: "/en/privacy",
  cookies: "/en/cookies",
} as const;

export type RouteKey = keyof typeof HU_SEGMENTS;

/** Generic segment map type — maps route keys to path strings. */
type SegmentMap = Record<RouteKey, string>;

const SEGMENT_MAP: Record<Locale, SegmentMap> = {
  hu: HU_SEGMENTS,
  en: EN_SEGMENTS,
};

export interface LocaleRouteMatch {
  locale: Locale;
  routeKey: RouteKey;
  slug?: string;
}

function normalizePathname(path: string): string {
  const pathname = stripSearch(path);
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

/**
 * Returns the locale implied by a path. Unknown /en paths are still treated as
 * English so the 404 page can use the correct language.
 */
export function getLocaleFromPath(path: string): Locale {
  const pathname = normalizePathname(path);
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : DEFAULT_LOCALE;
}

/**
 * Matches a known static or dynamic route.
 */
export function matchLocalePath(path: string): LocaleRouteMatch | null {
  const pathname = normalizePathname(path);
  const locale = getLocaleFromPath(pathname);
  const paths = SEGMENT_MAP[locale];

  for (const [routeKey, routePath] of Object.entries(paths) as [RouteKey, string][]) {
    if (!routePath.includes(":slug") && pathname === routePath) {
      return { locale, routeKey };
    }
  }

  for (const [routeKey, routePath] of Object.entries(paths) as [RouteKey, string][]) {
    if (!routePath.includes(":slug")) continue;
    const basePath = routePath.replace("/:slug", "");
    if (!pathname.startsWith(`${basePath}/`)) continue;

    const slug = pathname.slice(basePath.length + 1);
    if (slug && !slug.includes("/")) return { locale, routeKey, slug };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * Returns the path pattern for a given locale and route key.
 * Use this for <Route path="..."> registration.
 */
export function getRoutePath(locale: Locale, key: RouteKey): string {
  return SEGMENT_MAP[locale][key];
}

/**
 * Builds a concrete URL for a route, replacing :slug with the provided value.
 * Preserves any query string and hash from the optional `search` parameter.
 *
 * @example
 *   buildLocalePath("hu", "projectDetail", "my-project")
 *   // => "/projektek/my-project"
 *
 *   buildLocalePath("en", "blogPost", "hello-world", "?preview=1#top")
 *   // => "/en/blog/hello-world?preview=1#top"
 */
export function buildLocalePath(
  locale: Locale,
  key: RouteKey,
  slug?: string,
  search?: string
): string {
  let path = SEGMENT_MAP[locale][key] as string;
  if (slug !== undefined) {
    path = path.replace(":slug", encodeURIComponent(slug));
  }
  if (search) {
    // search may contain both ?query and #hash
    path = path + search;
  }
  return path;
}

/**
 * Parses query string and hash from a full URL/path string,
 * returning them as a single string suitable for buildLocalePath's `search`.
 *
 * @example
 *   extractSearch("/projektek/my-project?preview=1#section")
 *   // => "?preview=1#section"
 */
export function extractSearch(pathWithSearch: string): string {
  const qIdx = pathWithSearch.indexOf("?");
  const hIdx = pathWithSearch.indexOf("#");
  const start = qIdx !== -1 ? qIdx : hIdx !== -1 ? hIdx : -1;
  return start !== -1 ? pathWithSearch.slice(start) : "";
}

/**
 * Returns just the path portion of a URL (strips query and hash).
 *
 * @example
 *   stripSearch("/blog/hello?foo=1#top")
 *   // => "/blog/hello"
 */
export function stripSearch(pathWithSearch: string): string {
  const qIdx = pathWithSearch.indexOf("?");
  const hIdx = pathWithSearch.indexOf("#");
  const end =
    qIdx !== -1 && hIdx !== -1
      ? Math.min(qIdx, hIdx)
      : qIdx !== -1
        ? qIdx
        : hIdx !== -1
          ? hIdx
          : pathWithSearch.length;
  return pathWithSearch.slice(0, end);
}

/**
 * Localizes a CMS-authored link only when it is a known Hungarian internal
 * route. External URLs, fragments, and unknown/custom paths are preserved.
 */
export function localizeInternalPath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const match = matchLocalePath(href);
  if (!match || match.locale !== "hu") return href;
  return buildLocalePath(locale, match.routeKey, match.slug, extractSearch(href));
}

// ---------------------------------------------------------------------------
// Static route lists (for prerender / sitemap)
// ---------------------------------------------------------------------------

/** Static (no-slug) HU paths — matches current prerender staticRoutes list. */
export const HU_STATIC_PATHS: readonly string[] = [
  "/",
  "/projektek",
  "/blog",
  "/rolunk",
  "/kapcsolat",
  "/karrier",
  "/adatkezeles",
  "/sutik",
] as const;

/**
 * Static EN paths.
 */
export const EN_STATIC_PATHS: readonly string[] = [
  "/en",
  "/en/projects",
  "/en/blog",
  "/en/about",
  "/en/contact",
  "/en/careers",
  "/en/privacy",
  "/en/cookies",
] as const;

/**
 * Returns the static path list for a locale.
 * Throws for an unsupported public locale.
 */
export function getStaticPathsForLocale(locale: Locale): readonly string[] {
  if (!(PUBLIC_LOCALES as readonly Locale[]).includes(locale)) {
    throw new Error(
      `getStaticPathsForLocale: locale "${locale}" is not in PUBLIC_LOCALES. ` +
        `Add it to PUBLIC_LOCALES only when the full content pipeline is ready.`
    );
  }
  if (locale === "hu") return HU_STATIC_PATHS;
  return EN_STATIC_PATHS;
}

/** Builds the equivalent public path in another locale, or that locale's home
 * when the current path is not a canonical application route. */
export function switchLocalePath(path: string, targetLocale: Locale): string {
  const match = matchLocalePath(path);
  if (!match) return buildLocalePath(targetLocale, "home");
  return buildLocalePath(targetLocale, match.routeKey, match.slug, extractSearch(path));
}

// ---------------------------------------------------------------------------
// Locale query-key helper (for Strapi / TanStack Query callers)
// ---------------------------------------------------------------------------

/**
 * Builds a stable cache/query key that includes the locale when provided.
 *
 * @example
 *   localeQueryKey("projects")           // => ["projects"]
 *   localeQueryKey("projects", "hu")     // => ["projects", "hu"]
 *   localeQueryKey("project", "en", "my-slug") // => ["project", "en", "my-slug"]
 */
export function localeQueryKey(
  base: string,
  locale?: Locale,
  ...extra: string[]
): (string | undefined)[] {
  const key: (string | undefined)[] = [base];
  if (locale !== undefined) key.push(locale);
  key.push(...extra);
  return key;
}
