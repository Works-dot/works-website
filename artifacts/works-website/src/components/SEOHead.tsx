import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { getPageMeta, SITE_URL, localeToOgLocale, pageLocale } from "../seo-data";
import { getLocaleFromPath } from "@/lib/i18n-routes";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getGlobalSettings } from "@/lib/strapi";
import type { GlobalSettings } from "@/lib/strapi";
import { fallbackGlobalSettings } from "@/data/fallback";

const isSSR = typeof document === "undefined";

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export default function SEOHead() {
  const [location] = useLocation();

  // A prerenderelt (data-ssr jelölésű) title/meta/link tagek eltávolítása,
  // hogy a Helmet által kezeltekkel ne duplikálódjanak hidratálás után.
  useEffect(() => {
    document.querySelectorAll("head [data-ssr]").forEach((el) => el.remove());
  }, []);
  const { data: settings } = useStrapiQuery<GlobalSettings>("globalSettings", getGlobalSettings, fallbackGlobalSettings);

  if (isSSR) return null;

  const meta = getPageMeta(location, getLocaleFromPath(location));
  const lang = pageLocale(meta);
  const ogLocale = localeToOgLocale(lang);
  const ogImage = absoluteUrl(meta.ogImage || settings?.ogImageUrl || "/opengraph.jpg");
  const favicon = settings?.faviconUrl || "/favicon.ico";
  const canonical = absoluteUrl(meta.path || location);
  const ogType = meta.type === "article" ? "article" : "website";

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:site_name" content={settings?.siteName || "Works."} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImage} />
      <link rel="icon" href={favicon} />
    </Helmet>
  );
}
