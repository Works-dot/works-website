import { renderToString } from "react-dom/server";
import App from "./App";
import { routes } from "./routes.static";

export function render(url: string) {
  const html = renderToString(<App ssrPath={url} routes={routes} />);
  return { html };
}

export { fallbackProjects as projects } from "./data/fallback";
export { fallbackBlogPosts as blogPosts } from "./data/fallback";
export { fallbackServices as services } from "./data/fallback";
export { fallbackPositions as positions } from "./data/fallback";
export { getLocaleFallback } from "./data/fallback";
export { getLocaleCacheKey } from "./data/fallback";
export { getPageMeta, buildMetaTags, SITE_URL } from "./seo-data";

// Locale-aware route helpers for prerender scripts.
export {
  PUBLIC_LOCALES,
  ROUTE_LOCALES,
  DEFAULT_LOCALE,
  getStaticPathsForLocale,
  buildLocalePath,
  getLocaleFromPath,
  matchLocalePath,
  extractSearch,
  stripSearch,
  switchLocalePath,
  localeQueryKey,
} from "./lib/i18n-routes";
export type { Locale, RouteKey } from "./lib/i18n-routes";
