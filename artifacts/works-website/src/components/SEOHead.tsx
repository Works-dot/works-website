import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { getPageMeta } from "../seo-data";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getGlobalSettings } from "@/lib/strapi";
import type { GlobalSettings } from "@/lib/strapi";
import { fallbackGlobalSettings } from "@/data/fallback";

const isSSR = typeof document === "undefined";

export default function SEOHead() {
  const [location] = useLocation();
  const { data: settings } = useStrapiQuery<GlobalSettings>("globalSettings", getGlobalSettings, fallbackGlobalSettings);

  if (isSSR) return null;

  const meta = getPageMeta(location);
  const ogImage = meta.ogImage || settings?.ogImageUrl || "/opengraph.jpg";
  const favicon = settings?.faviconUrl || "/favicon.ico";

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="hu_HU" />
      <meta property="og:site_name" content={settings?.siteName || "Works."} />
      <meta property="og:image" content={ogImage} />
      <link rel="icon" href={favicon} />
    </Helmet>
  );
}
