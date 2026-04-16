import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

export function render(url: string) {
  const html = renderToString(
    <HelmetProvider>
      <App ssrPath={url} />
    </HelmetProvider>
  );
  return { html };
}

export { fallbackProjects as projects } from "./data/fallback";
export { fallbackBlogPosts as blogPosts } from "./data/fallback";
export { fallbackServices as services } from "./data/fallback";
export { fallbackPositions as positions } from "./data/fallback";
export { getPageMeta, buildMetaTags } from "./seo-data";
