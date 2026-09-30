import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { matchesRouteSnapshot, spaPageViews, useRawPagePath } from "@/lib/gtm-tracking";
import {
  buildJsonLd,
  getAlternateLinks,
  getPageMeta,
  SITE_URL,
  localeToOgLocale,
  pageLocale,
} from "../seo-data";
import { getLocaleFromPath, matchLocalePath } from "@/lib/i18n-routes";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { useI18n } from "@/i18n";
import { getBlogPage, getGlobalSettings, getProjectsPage } from "@/lib/strapi";
import type { BlogPageData, GlobalSettings, ProjectsPageData } from "@/lib/strapi";
import type { StructuredContent } from "../seo-data";
import { fallbackBlogPage, fallbackGlobalSettings, fallbackProjectsPage } from "@/data/fallback";

const CLIENT_SEO_ATTRIBUTE = "data-client-seo";
const CLIENT_JSON_LD_ATTRIBUTE = "data-client-json-ld";

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
  element.setAttribute(CLIENT_SEO_ATTRIBUTE, "");
  element.removeAttribute("data-ssr");
}

function removeMeta(attribute: "name" | "property", key: string) {
  document.head
    .querySelectorAll(`meta[${attribute}="${key}"]`)
    .forEach((element) => element.remove());
}

function upsertLink(rel: "canonical" | "icon", href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
  element.setAttribute(CLIENT_SEO_ATTRIBUTE, "");
  element.removeAttribute("data-ssr");
}

function removeOwnedLink(rel: "canonical" | "alternate") {
  document.head
    .querySelectorAll(
      `link[rel="${rel}"][data-ssr], link[rel="${rel}"][${CLIENT_SEO_ATTRIBUTE}]`,
    )
    .forEach((element) => element.remove());
}

function syncAlternateLinks(
  alternates: { hreflang: string; href: string }[],
) {
  // SSR owns the initial links; the client takes ownership on hydration and
  // removes the previous route's links before adding the current set. This
  // prevents stale language URLs after SPA navigation without touching
  // third-party, unowned head tags.
  removeOwnedLink("alternate");

  for (const { hreflang, href } of alternates) {
    const element = document.createElement("link");
    element.rel = "alternate";
    element.hreflang = hreflang;
    element.href = href;
    element.setAttribute(CLIENT_SEO_ATTRIBUTE, "");
    document.head.appendChild(element);
  }
}

function upsertTitle(title: string) {
  let element = document.head.querySelector<HTMLTitleElement>("title");

  if (!element) {
    element = document.createElement("title");
    document.head.appendChild(element);
  }

  element.textContent = title;
  element.setAttribute(CLIENT_SEO_ATTRIBUTE, "");
  element.removeAttribute("data-ssr");
}

function syncJsonLd(scriptMarkup: string[]) {
  document.head
    .querySelectorAll(
      `script[type="application/ld+json"][data-ssr], script[${CLIENT_JSON_LD_ATTRIBUTE}]`,
    )
    .forEach((element) => element.remove());

  for (const markup of scriptMarkup) {
    const content = markup.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
    if (!content) continue;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = content;
    script.setAttribute(CLIENT_JSON_LD_ATTRIBUTE, "");
    document.head.appendChild(script);
  }
}

export default function SEOHead({ structuredContent, ready = true, noindex = false }: { structuredContent?: StructuredContent; ready?: boolean; noindex?: boolean }) {
  const [location] = useLocation();
  const search = useSearch();
  const pagePath = useRawPagePath();
  const { locale } = useI18n();
  const { data: settings, loading: settingsLoading } = useStrapiQuery<GlobalSettings>("globalSettings", () => getGlobalSettings(locale), fallbackGlobalSettings, locale);
  const { data: projectsPage, loading: projectsLoading } = useStrapiQuery<ProjectsPageData>(
    "projectsPage",
    () => getProjectsPage(locale),
    fallbackProjectsPage,
    locale
  );
  const { data: blogPage, loading: blogLoading } = useStrapiQuery<BlogPageData>(
    "blogPage",
    () => getBlogPage(locale),
    fallbackBlogPage,
    locale
  );

  const baseMeta = getPageMeta(location, getLocaleFromPath(location));
  const lang = pageLocale(baseMeta);
  const routeKey = matchLocalePath(location)?.routeKey;
  const seoFetching = settingsLoading ||
    (lang === "hu" && routeKey === "projects" && projectsLoading) ||
    (lang === "hu" && routeKey === "blog" && blogLoading);
  const pageSeo =
    lang === "hu" && routeKey === "projects"
      ? projectsPage?.seo
      : lang === "hu" && routeKey === "blog"
        ? blogPage?.seo
        : null;
  const detail = routeKey === "projectDetail" ? structuredContent?.project :
    routeKey === "blogPost" ? structuredContent?.post :
    routeKey === "serviceDetail" ? structuredContent?.service :
    routeKey === "careerDetail" ? structuredContent?.position : null;
  const detailDescription = detail && ("caseStudy" in detail ? detail.caseStudy.heroSubtitle :
    "excerpt" in detail ? detail.excerpt :
    "heroDescription" in detail ? detail.heroDescription : baseMeta.description);
  const detailSeo = detail?.seo;
  const meta = detail
    ? {
        ...baseMeta,
        title: detailSeo?.metaTitle?.trim() || `${detail.title} | Works.`,
        description: detailSeo?.metaDescription?.trim() || detailDescription || baseMeta.description,
        ogImage: detailSeo?.ogImage || baseMeta.ogImage,
      }
    : pageSeo
    ? {
        ...baseMeta,
        title: pageSeo.metaTitle?.trim() || baseMeta.title,
        description:
          pageSeo.metaDescription?.trim() || baseMeta.description,
        ogImage: pageSeo.ogImage || baseMeta.ogImage,
      }
    : baseMeta;
  const ogLocale = localeToOgLocale(lang);
  const ogImage = absoluteUrl(meta.ogImage || settings?.ogImageUrl || "/opengraph.jpg");
  const favicon = settings?.faviconUrl || "/favicon.ico";
  const canonical = meta.path ? absoluteUrl(meta.path) : undefined;
  const ogType = meta.type === "article" ? "article" : "website";
  const alternates = meta.path ? getAlternateLinks(location, lang) : [];

  useEffect(() => {
    document.documentElement.lang = lang;
    upsertTitle(meta.title);
    upsertMeta("name", "description", meta.description);
    document.head
      .querySelectorAll(`meta[name="robots"][${CLIENT_SEO_ATTRIBUTE}]`)
      .forEach((element) => element.remove());
    if (noindex) upsertMeta("name", "robots", "noindex, nofollow");
    if (canonical) {
      upsertLink("canonical", canonical);
    } else {
      removeOwnedLink("canonical");
    }
    syncAlternateLinks(alternates);
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:type", ogType);
    if (canonical) {
      upsertMeta("property", "og:url", canonical);
    } else {
      removeMeta("property", "og:url");
    }
    upsertMeta("property", "og:locale", ogLocale);
    upsertMeta("property", "og:site_name", settings?.siteName || "Works.");
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertMeta("name", "twitter:image", ogImage);
    upsertLink("icon", favicon);

    if (meta.article?.publishedTime) {
      upsertMeta(
        "property",
        "article:published_time",
        meta.article.publishedTime,
      );
    } else {
      removeMeta("property", "article:published_time");
    }

    syncJsonLd(buildJsonLd(meta, settings, structuredContent));

    document
      .querySelectorAll(`head [data-ssr]:not([${CLIENT_SEO_ATTRIBUTE}])`)
      .forEach((element) => element.remove());
    // Acknowledge the completed head write only when the route's relevant
    // CMS metadata has settled. The tracker rejects stale route acknowledgments.
    if (ready && !seoFetching && matchesRouteSnapshot(pagePath, location, search, import.meta.env.BASE_URL)) {
      spaPageViews.seoCommitted(
        pagePath,
        document.title,
      );
    }
  }, [
    canonical,
    favicon,
    lang,
    meta.description,
    meta.title,
    meta.article?.publishedTime,
    location,
    pagePath,
    search,
    seoFetching,
    ready,
    noindex,
    ogImage,
    ogLocale,
    ogType,
    alternates,
    settings?.siteName,
    settings?.socialLinks,
    settings?.contactEmail,
    settings?.contactPhone,
    structuredContent,
  ]);

  return null;
}
