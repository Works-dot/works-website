import {
  fallbackProjects,
  fallbackBlogPosts,
  fallbackServices,
  fallbackPositions,
  fallbackHomepage,
  fallbackAboutPage,
  fallbackContactPage,
  fallbackCareerPage,
} from "./data/fallback";
import type { SeoOverride } from "./lib/strapi";
import {
  buildLocalePath,
  getLocaleFromPath,
  matchLocalePath,
  stripSearch,
  type Locale,
} from "./lib/i18n-routes";

export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
  /** Route path, e.g. "/blog/cikk-slug" — used for canonical / og:url. */
  path?: string;
  /** og:type — "article" for blog posts & case studies, otherwise "website". */
  type?: "website" | "article";
  /** Extra data for BlogPosting JSON-LD on blog articles. */
  article?: { publishedTime?: string; author?: string };
  /** Breadcrumb trail for BreadcrumbList JSON-LD (home is added automatically). */
  breadcrumbs?: { name: string; path: string }[];
  /**
   * BCP-47 language tag for this page, e.g. "hu" or "en".
   * Defaults to "hu" when absent.
   */
  locale?: Locale;
}

const configuredSiteUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.VITE_SITE_URL) ||
  (typeof process !== "undefined" && process.env?.SITE_URL) ||
  "";

export const SITE_URL = (
  configuredSiteUrl || "https://workspaceworks-website-production.up.railway.app"
).replace(/\/+$/, "");

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function withOverride(base: PageMeta, seo?: SeoOverride | null): PageMeta {
  if (!seo) return base;
  return {
    ...base,
    title: seo.metaTitle?.trim() || base.title,
    description: seo.metaDescription?.trim() || base.description,
    ogImage: seo.ogImage || base.ogImage,
  };
}

// ---------------------------------------------------------------------------
// HU defaults (current public content)
// ---------------------------------------------------------------------------

const DEFAULT_TITLE = "Works. | Digitális Ügynökség";
const DEFAULT_DESCRIPTION =
  "Magyar digitális ügynökség — UX kutatás, service design, UI design, akadálymentesítés, AI-alapú tervezés, webfejlesztés.";
const EN_DEFAULT_TITLE = "Works. | Digital Agency";
const EN_DEFAULT_DESCRIPTION =
  "A digital agency for UX research, service design, UI design, accessibility, AI-assisted design and web development.";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";

function formatTitle(pageTitle: string): string {
  return `${pageTitle} | Works.`;
}

const staticMeta: Record<string, PageMeta> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  "/projektek": {
    title: formatTitle("Projektjeink"),
    description:
      "Válogatás a Works. referencia munkáiból — UX kutatás, UI design, akadálymentesítés és webfejlesztési projektek.",
  },
  "/blog": {
    title: formatTitle("Blog"),
    description:
      "UX, UI design és digitális stratégia cikkek a Works. csapatától — szakmai inspiráció designereknek és termékcsapatoknak.",
  },
  "/rolunk": {
    title: formatTitle("Rólunk"),
    description:
      "Ismerd meg a Works. csapatát — tapasztalt UX kutatók, UI designerek és fejlesztők, akik digitális termékekkel tesznek hatást.",
  },
  "/kapcsolat": {
    title: formatTitle("Kapcsolat"),
    description:
      "Vedd fel velünk a kapcsolatot! Budapesti irodánkban vagy online is elérhetőek vagyunk UX, UI és webfejlesztési projektekhez.",
  },
  "/karrier": {
    title: formatTitle("Karrier"),
    description:
      "Csatlakozz a Works. csapatához! Nyitott pozícióink UX kutatás, UI design, fejlesztés és service design területeken.",
  },
  "/adatkezeles": {
    title: formatTitle("Adatkezelési tájékoztató"),
    description:
      "A Works. adatkezelési tájékoztatója — hogyan kezeljük a weboldal látogatóinak és a velünk kapcsolatba lépőknek a személyes adatait.",
  },
  "/sutik": {
    title: formatTitle("Süti tájékoztató"),
    description:
      "Tájékoztató a Works. weboldalán használt sütikről és a Google Térkép beágyazásról — mihez kérünk hozzájárulást és hogyan módosíthatod.",
  },
};

const pageSeoOverrides: Record<string, SeoOverride | null | undefined> = {
  "/": fallbackHomepage?.seo,
  "/rolunk": fallbackAboutPage?.seo,
  "/kapcsolat": fallbackContactPage?.seo,
  "/karrier": fallbackCareerPage?.seo,
};

// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

/**
 * Maps a BCP-47 locale tag to an og:locale string.
 *  "hu" → "hu_HU"
 *  "en" → "en_US"
 *  anything else → "hu_HU" (safe fallback)
 */
export function localeToOgLocale(locale: string): string {
  if (locale === "hu") return "hu_HU";
  if (locale === "en") return "en_US";
  return "hu_HU";
}

/**
 * Returns the BCP-47 language tag to use in JSON-LD inLanguage.
 * Defaults to "hu".
 */
export function pageLocale(meta: PageMeta): Locale {
  return meta.locale === "en" ? "en" : "hu";
}

// ---------------------------------------------------------------------------
// getPageMeta — locale-aware
// ---------------------------------------------------------------------------

/**
 * Returns PageMeta for a given route path.
 *
 * @param route - The pathname, e.g. "/projektek/my-project"
 * @param locale - Optional BCP-47 locale; defaults to "hu".
 *   The EN locale is accepted by the type system for forward-compat, but
 *   EN routes are NOT public and must not be passed by prerender scripts.
 */
export function getPageMeta(route: string, locale?: Locale): PageMeta {
  const strippedPath = stripSearch(route);
  const pathname =
    strippedPath.length > 1 ? strippedPath.replace(/\/+$/, "") : strippedPath;
  const routeMatch = matchLocalePath(pathname);
  const lang = locale || routeMatch?.locale || getLocaleFromPath(pathname);

  // EN content is intentionally not populated yet. Reserved EN routes still
  // receive language-correct generic metadata and their own canonical path,
  // without making those routes public.
  if (lang === "en") {
    const isReservedEnglishRoute = routeMatch?.locale === "en";
    const isArticle =
      routeMatch?.routeKey === "blogPost" || routeMatch?.routeKey === "projectDetail";
    return {
      title: EN_DEFAULT_TITLE,
      description: EN_DEFAULT_DESCRIPTION,
      path: isReservedEnglishRoute ? pathname : undefined,
      type: isArticle ? "article" : "website",
      locale: "en",
    };
  }

  if (staticMeta[pathname]) {
    const base = withOverride(staticMeta[pathname], pageSeoOverrides[pathname]);
    return { ...base, path: pathname, type: "website", locale: lang };
  }

  const projectMatch = pathname.match(/^\/projektek\/(.+)$/);
  if (projectMatch) {
    const project = fallbackProjects.find((p) => p.slug === projectMatch[1]);
    if (project) {
      const base = withOverride(
        {
          title: formatTitle(project.title),
          description: project.caseStudy.heroSubtitle,
          ogImage: project.image,
        },
        project.seo
      );
      return {
        ...base,
        path: pathname,
        type: "article",
        locale: lang,
        breadcrumbs: [
          { name: "Projektek", path: "/projektek" },
          { name: project.title, path: pathname },
        ],
      };
    }
  }

  const blogMatch = pathname.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const post = fallbackBlogPosts.find((p) => p.slug === blogMatch[1]);
    if (post) {
      const base = withOverride(
        {
          title: formatTitle(post.title),
          description: post.excerpt,
          ogImage: post.image,
        },
        post.seo
      );
      return {
        ...base,
        path: pathname,
        type: "article",
        locale: lang,
        article: { publishedTime: post.date, author: post.author || undefined },
        breadcrumbs: [
          { name: "Blog", path: "/blog" },
          { name: post.title, path: pathname },
        ],
      };
    }
  }

  const serviceMatch = pathname.match(/^\/szolgaltatasok\/(.+)$/);
  if (serviceMatch) {
    const service = fallbackServices.find((s) => s.slug === serviceMatch[1]);
    if (service) {
      const base = withOverride(
        {
          title: formatTitle(service.title),
          description: service.heroDescription,
        },
        service.seo
      );
      return {
        ...base,
        path: pathname,
        type: "website",
        locale: lang,
        breadcrumbs: [{ name: service.title, path: pathname }],
      };
    }
  }

  const careerMatch = pathname.match(/^\/karrier\/(.+)$/);
  if (careerMatch) {
    const position = fallbackPositions.find((p) => p.slug === careerMatch[1]);
    if (position) {
      const base = withOverride(
        {
          title: formatTitle(`${position.title} — Karrier`),
          description: position.excerpt,
        },
        position.seo
      );
      return {
        ...base,
        path: pathname,
        type: "website",
        locale: lang,
        breadcrumbs: [
          { name: "Karrier", path: "/karrier" },
          { name: position.title, path: pathname },
        ],
      };
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, type: "website", locale: lang };
}

function jsonLdScript(data: object): string {
  // "<" escape-elve, hogy a JSON ne tudjon kitörni a <script> tagből.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script data-ssr type="application/ld+json">${json}</script>`;
}

export function buildJsonLd(meta: PageMeta): string[] {
  const scripts: string[] = [];
  const lang = pageLocale(meta);
  const localizedHome = absoluteUrl(buildLocalePath(lang, "home"));
  const localizedDescription = lang === "en" ? EN_DEFAULT_DESCRIPTION : DEFAULT_DESCRIPTION;

  scripts.push(
    jsonLdScript({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Works.",
      url: SITE_URL,
      logo: absoluteUrl("/favicon.svg"),
      description: localizedDescription,
    })
  );

  scripts.push(
    jsonLdScript({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Works.",
      url: localizedHome,
      inLanguage: lang,
    })
  );

  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    scripts.push(
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: lang === "en" ? "Home" : "Főoldal",
            item: localizedHome,
          },
          ...meta.breadcrumbs.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 2,
            name: crumb.name,
            item: absoluteUrl(crumb.path),
          })),
        ],
      })
    );
  }

  if (meta.article) {
    const posting: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: meta.title.replace(/ \| Works\.$/, ""),
      description: meta.description,
      inLanguage: lang,
      image: absoluteUrl(meta.ogImage || DEFAULT_OG_IMAGE),
      publisher: { "@type": "Organization", name: "Works.", url: SITE_URL },
      mainEntityOfPage: meta.path ? absoluteUrl(meta.path) : SITE_URL,
    };
    if (meta.article.publishedTime) posting.datePublished = meta.article.publishedTime;
    if (meta.article.author) posting.author = { "@type": "Person", name: meta.article.author };
    scripts.push(jsonLdScript(posting));
  }

  return scripts;
}

export function buildMetaTags(meta: PageMeta): string {
  const escaped = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  const ogImage = absoluteUrl(meta.ogImage || DEFAULT_OG_IMAGE);
  const ogType = meta.type === "article" ? "article" : "website";
  const canonical = meta.path ? absoluteUrl(meta.path) : undefined;
  const ogLocale = localeToOgLocale(pageLocale(meta));

  // data-ssr jelölés: a kliensoldali SEOHead ezeket helyben frissíti vagy
  // lecseréli, így route-váltás után sem marad duplikált vagy elavult tag.
  const tags = [
    `<title data-ssr>${escaped(meta.title)}</title>`,
    `<meta data-ssr name="description" content="${escaped(meta.description)}" />`,
    ...(canonical ? [`<link data-ssr rel="canonical" href="${escaped(canonical)}" />`] : []),
    `<meta data-ssr property="og:title" content="${escaped(meta.title)}" />`,
    `<meta data-ssr property="og:description" content="${escaped(meta.description)}" />`,
    `<meta data-ssr property="og:type" content="${ogType}" />`,
    ...(canonical ? [`<meta data-ssr property="og:url" content="${escaped(canonical)}" />`] : []),
    `<meta data-ssr property="og:locale" content="${ogLocale}" />`,
    `<meta data-ssr property="og:site_name" content="Works." />`,
    `<meta data-ssr property="og:image" content="${escaped(ogImage)}" />`,
    `<meta data-ssr name="twitter:card" content="summary_large_image" />`,
    `<meta data-ssr name="twitter:title" content="${escaped(meta.title)}" />`,
    `<meta data-ssr name="twitter:description" content="${escaped(meta.description)}" />`,
    `<meta data-ssr name="twitter:image" content="${escaped(ogImage)}" />`,
  ];

  if (meta.article?.publishedTime) {
    tags.push(
      `<meta data-ssr property="article:published_time" content="${escaped(meta.article.publishedTime)}" />`
    );
  }

  tags.push(...buildJsonLd(meta));

  return tags.join("\n    ");
}
