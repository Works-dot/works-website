import {
  fallbackProjects,
  fallbackBlogPosts,
  fallbackServices,
  fallbackPositions,
  fallbackHomepage,
  fallbackAboutPage,
  fallbackContactPage,
  fallbackCareerPage,
  fallbackProjectsPage,
  fallbackBlogPage,
  getLocaleFallback,
  getLocaleCounterpartSlug,
} from "./data/fallback";
import type { GlobalSettings, SeoOverride } from "./lib/strapi";
import {
  buildLocalePath,
  getLocaleFromPath,
  matchLocalePath,
  stripSearch,
  type Locale,
  type RouteKey,
} from "./lib/i18n-routes";
import { DEFAULT_SITE_URL, resolveSiteUrl } from "./seo-config";
import { organizationIdentity } from "./data/organization";
import type { BlogPost, CareerPosition, Project, Service, TeamMember } from "./lib/strapi";
import cachedContent from "./data/strapi-cache.json";

export interface StructuredContent {
  service?: Service | null;
  position?: CareerPosition | null;
  team?: TeamMember[] | null;
  projects?: Project[] | null;
  posts?: BlogPost[] | null;
}

// Unlike editorial fallbacks, team identities must come from published CMS content.
function publishedTeam(locale: Locale): TeamMember[] {
  const cache = cachedContent as Partial<Record<Locale, { teamMembers?: TeamMember[] }>>;
  return cache[locale]?.teamMembers || [];
}

function routeContent(meta: PageMeta, supplied?: StructuredContent): StructuredContent {
  if (!meta.path) return {};
  const route = matchLocalePath(meta.path);
  if (!route) return {};
  const locale = pageLocale(meta);
  const slug = route.slug ? decodeURIComponent(route.slug) : "";
  switch (route.routeKey) {
    case "serviceDetail":
      return { service: supplied ? supplied.service : getLocaleFallback<Service>(`service:${slug}`, locale) };
    case "careerDetail":
      return { position: supplied ? supplied.position : getLocaleFallback<CareerPosition>(`careerPosition:${slug}`, locale) };
    case "about":
      return { team: supplied ? supplied.team : publishedTeam(locale) };
    case "projects":
      return { projects: supplied ? supplied.projects : getLocaleFallback<Project[]>("projects", locale) };
    case "blog":
      return { posts: supplied ? supplied.posts : getLocaleFallback<BlogPost[]>("blogPosts", locale) };
    default:
      return {};
  }
}

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
  /** Reciprocal language alternates for this real, public page. */
  alternates?: AlternateLink[];
}

export interface AlternateLink {
  hreflang: "hu" | "en" | "x-default";
  href: string;
}

/*
 * Vite replaces this value in both the browser and SSR bundles.  The
 * vite.config.ts define below deliberately gives both bundles the same value,
 * so a separately configured SITE_URL cannot make client and server disagree.
 */
const configuredSiteUrl =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.VITE_SITE_URL) ||
  DEFAULT_SITE_URL;

export const SITE_URL = resolveSiteUrl(configuredSiteUrl);

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
// Locale defaults
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

type DetailRouteKey =
  | "projectDetail"
  | "blogPost"
  | "serviceDetail"
  | "careerDetail";

const detailCollectionKeys: Record<DetailRouteKey, string> = {
  projectDetail: "projects",
  blogPost: "blogPosts",
  serviceDetail: "services",
  careerDetail: "careerPositions",
};

function isDetailRouteKey(routeKey: RouteKey): routeKey is DetailRouteKey {
  return routeKey in detailCollectionKeys;
}

function detailRecordExists(
  locale: Locale,
  routeKey: DetailRouteKey,
  slug: string,
): boolean {
  const records = getLocaleFallback<{ slug: string }[]>(
    detailCollectionKeys[routeKey],
    locale,
  );
  return Boolean(records?.some((record) => record.slug === slug));
}

/**
 * Returns absolute reciprocal language links only for pages that really exist
 * in both locale datasets.  Detail pages are paired by Strapi's stable
 * documentId through getLocaleCounterpartSlug; matching slugs is not safe.
 *
 * An HU-only detail page is still a real default-language page, so it gets a
 * self HU link and x-default.  An EN-only detail page gets no alternates: it
 * cannot claim a reciprocal HU translation or fabricate an HU URL.
 */
export function getAlternateLinks(
  route: string,
  locale?: Locale,
): AlternateLink[] {
  const pathname = stripSearch(route);
  const routeMatch = matchLocalePath(pathname);
  if (!routeMatch) return [];

  const sourceLocale = locale || routeMatch.locale;
  const routeKey = routeMatch.routeKey;
  if (["privacy", "cookies", "imprint"].includes(routeKey)) {
    return routeMatch.locale === "hu" ? [
      { hreflang: "hu", href: absoluteUrl(buildLocalePath("hu", routeKey)) },
      { hreflang: "x-default", href: absoluteUrl(buildLocalePath("hu", routeKey)) },
    ] : [];
  }
  const huPath = buildLocalePath(
    "hu",
    routeKey,
    routeMatch.slug ? decodeURIComponent(routeMatch.slug) : undefined,
  );
  const enPath = buildLocalePath(
    "en",
    routeKey,
    routeMatch.slug ? decodeURIComponent(routeMatch.slug) : undefined,
  );

  if (!isDetailRouteKey(routeKey)) {
    return [
      { hreflang: "hu", href: absoluteUrl(huPath) },
      { hreflang: "en", href: absoluteUrl(enPath) },
      { hreflang: "x-default", href: absoluteUrl(huPath) },
    ];
  }

  const sourceSlug = routeMatch.slug
    ? decodeURIComponent(routeMatch.slug)
    : undefined;
  if (!sourceSlug || !detailRecordExists(sourceLocale, routeKey, sourceSlug)) {
    return [];
  }

  const targetLocale: Locale = sourceLocale === "hu" ? "en" : "hu";
  const counterpartSlug = getLocaleCounterpartSlug(
    sourceLocale,
    targetLocale,
    routeKey,
    sourceSlug,
  );

  if (sourceLocale === "en" && !counterpartSlug) {
    return [];
  }

  if (!counterpartSlug) {
    const currentHuPath = buildLocalePath("hu", routeKey, sourceSlug);
    return [
      { hreflang: "hu", href: absoluteUrl(currentHuPath) },
      { hreflang: "x-default", href: absoluteUrl(currentHuPath) },
    ];
  }

  const pairedHuPath =
    sourceLocale === "hu"
      ? buildLocalePath("hu", routeKey, sourceSlug)
      : buildLocalePath("hu", routeKey, counterpartSlug);
  const pairedEnPath =
    sourceLocale === "en"
      ? buildLocalePath("en", routeKey, sourceSlug)
      : buildLocalePath("en", routeKey, counterpartSlug);

  return [
    { hreflang: "hu", href: absoluteUrl(pairedHuPath) },
    { hreflang: "en", href: absoluteUrl(pairedEnPath) },
    { hreflang: "x-default", href: absoluteUrl(pairedHuPath) },
  ];
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
  "/impresszum": {
    title: formatTitle("Impresszum"),
    description: "A Works. Hungary Kft. cégadatai, elérhetőségei és tárhelyszolgáltatója.",
  },
  "/sutik": {
    title: formatTitle("Süti tájékoztató"),
    description:
      "Tájékoztató a Works. weboldalán használt sütikről és a Google Térkép beágyazásról — mihez kérünk hozzájárulást és hogyan módosíthatod.",
  },
};

const enStaticMeta: Partial<Record<NonNullable<ReturnType<typeof matchLocalePath>>["routeKey"], PageMeta>> = {
  home: {
    title: EN_DEFAULT_TITLE,
    description: EN_DEFAULT_DESCRIPTION,
  },
  projects: {
    title: formatTitle("Our projects"),
    description:
      "Selected Works. case studies in UX research, UI design, accessibility and web development.",
  },
  blog: {
    title: formatTitle("Blog"),
    description:
      "Articles on UX, UI design and digital strategy from the Works. team.",
  },
  about: {
    title: formatTitle("About us"),
    description:
      "Meet the Works. team of UX researchers, UI designers and developers creating impactful digital products.",
  },
  contact: {
    title: formatTitle("Contact"),
    description:
      "Contact Works. in Budapest or online about UX, UI and web development projects.",
  },
  careers: {
    title: formatTitle("Careers"),
    description:
      "Explore career opportunities at Works. across UX research, UI design, development and service design.",
  },
  privacy: {
    title: formatTitle("Privacy notice"),
    description:
      "Learn how Works. handles personal data belonging to website visitors and people who contact us.",
  },
  cookies: {
    title: formatTitle("Cookie notice"),
    description:
      "Learn about cookies and embedded Google Maps on the Works. website and how to change your consent.",
  },
};

const pageSeoOverrides: Record<string, SeoOverride | null | undefined> = {
  "/": fallbackHomepage?.seo,
  "/rolunk": fallbackAboutPage?.seo,
  "/kapcsolat": fallbackContactPage?.seo,
  "/karrier": fallbackCareerPage?.seo,
  "/projektek": fallbackProjectsPage?.seo,
  "/blog": fallbackBlogPage?.seo,
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
 */
export function getPageMeta(route: string, locale?: Locale): PageMeta {
  const strippedPath = stripSearch(route);
  const pathname =
    strippedPath.length > 1 ? strippedPath.replace(/\/+$/, "") : strippedPath;
  const routeMatch = matchLocalePath(pathname);
  const lang = locale || routeMatch?.locale || getLocaleFromPath(pathname);
  if (routeMatch?.locale === "en" && ["privacy", "cookies", "imprint"].includes(routeMatch.routeKey)) {
    // These URLs are temporary redirects, not published English documents.
    return { title: EN_DEFAULT_TITLE, description: EN_DEFAULT_DESCRIPTION, locale: "en", alternates: [] };
  }

  if (lang === "en") {
    const isEnglishRoute = routeMatch?.locale === "en";
    const detailSlug = routeMatch?.slug
      ? decodeURIComponent(routeMatch.slug)
      : undefined;
    const staticDefault = routeMatch ? enStaticMeta[routeMatch.routeKey] : undefined;
    const detailLabel =
      routeMatch?.routeKey === "projectDetail"
        ? "Projects"
        : routeMatch?.routeKey === "blogPost"
          ? "Blog"
          : routeMatch?.routeKey === "serviceDetail"
            ? "Services"
            : routeMatch?.routeKey === "careerDetail"
              ? "Careers"
              : undefined;
    const detailParent =
      routeMatch?.routeKey === "projectDetail"
        ? buildLocalePath("en", "projects")
        : routeMatch?.routeKey === "blogPost"
          ? buildLocalePath("en", "blog")
          : routeMatch?.routeKey === "careerDetail"
            ? buildLocalePath("en", "careers")
            : undefined;
    const project = routeMatch?.routeKey === "projectDetail"
      ? getLocaleFallback<typeof fallbackProjects[number]>(`project:${detailSlug}`, "en")
      : undefined;
    const post = routeMatch?.routeKey === "blogPost"
      ? getLocaleFallback<typeof fallbackBlogPosts[number]>(`blogPost:${detailSlug}`, "en")
      : undefined;
    const service = routeMatch?.routeKey === "serviceDetail"
      ? getLocaleFallback<typeof fallbackServices[number]>(`service:${detailSlug}`, "en")
      : undefined;
    const position = routeMatch?.routeKey === "careerDetail"
      ? getLocaleFallback<typeof fallbackPositions[number]>(`careerPosition:${detailSlug}`, "en")
      : undefined;
    const detailRecord = project || post || service || position;
    const isDetailRoute = routeMatch ? isDetailRouteKey(routeMatch.routeKey) : false;
    const hasRealEnglishPage = !isDetailRoute || Boolean(detailRecord);
    const isArticle =
      hasRealEnglishPage &&
      (routeMatch?.routeKey === "blogPost" || routeMatch?.routeKey === "projectDetail");
    const detailSeo = project?.seo || post?.seo || service?.seo || position?.seo;
    const staticSeo =
      routeMatch?.routeKey === "projects"
        ? getLocaleFallback<typeof fallbackProjectsPage>("projectsPage", "en")?.seo
        : routeMatch?.routeKey === "blog"
          ? getLocaleFallback<typeof fallbackBlogPage>("blogPage", "en")?.seo
          : undefined;
    const detailDescription =
      project?.caseStudy.heroSubtitle || post?.excerpt || service?.heroDescription || position?.excerpt;
    const meta = withOverride({
      title: staticDefault?.title || EN_DEFAULT_TITLE,
      description: detailDescription || staticDefault?.description || EN_DEFAULT_DESCRIPTION,
      ogImage: project?.image || post?.image,
      // A route pattern alone is not an English detail page.  Only a record
      // present in the EN dataset may receive a canonical or hreflang URL.
      path: isEnglishRoute && hasRealEnglishPage ? pathname : undefined,
      type: isArticle ? "article" : "website",
      locale: "en",
      ...(post
        ? { article: { publishedTime: post.date, author: post.author || undefined } }
        : {}),
      ...(detailLabel && detailRecord && hasRealEnglishPage
        ? {
            breadcrumbs: [
              ...(detailParent ? [{ name: detailLabel, path: detailParent }] : []),
              { name: routeMatch?.slug || detailLabel, path: pathname },
            ],
          }
        : {}),
    }, detailSeo || staticSeo);
    return {
      ...meta,
      alternates:
        meta.path && hasRealEnglishPage
          ? getAlternateLinks(pathname, "en")
          : [],
    };
  }

  if (staticMeta[pathname]) {
    const base = withOverride(staticMeta[pathname], pageSeoOverrides[pathname]);
    return {
      ...base,
      path: pathname,
      type: "website",
      locale: lang,
      alternates: getAlternateLinks(pathname, lang),
    };
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
        alternates: getAlternateLinks(pathname, "hu"),
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
        alternates: getAlternateLinks(pathname, "hu"),
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
        alternates: getAlternateLinks(pathname, "hu"),
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
        alternates: getAlternateLinks(pathname, "hu"),
        breadcrumbs: [
          { name: "Karrier", path: "/karrier" },
          { name: position.title, path: pathname },
        ],
      };
    }
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: "website",
    locale: lang,
    alternates: [],
  };
}

function jsonLdScript(data: object): string {
  // "<" escape-elve, hogy a JSON ne tudjon kitörni a <script> tagből.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script data-ssr type="application/ld+json">${json}</script>`;
}

/** Keep published URLs verbatim; reject values that would be reinterpreted by URL parsing. */
export function validSocialLinks(links?: GlobalSettings["socialLinks"]): GlobalSettings["socialLinks"] {
  const seen = new Set<string>();
  return (links || []).filter((link) => {
    if (!link || typeof link.url !== "string" || !/^https?:\/\//i.test(link.url) ||
        /[\s\\]/.test(link.url)) return false;
    try {
      const parsed = new URL(link.url);
      if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname ||
          parsed.username || parsed.password || seen.has(parsed.href)) return false;
      seen.add(parsed.href);
      return true;
    } catch {
      return false;
    }
  });
}

export function buildJsonLd(
  meta: PageMeta,
  settings: GlobalSettings | null | undefined = getLocaleFallback<GlobalSettings>("globalSettings", pageLocale(meta)),
  supplied?: StructuredContent,
): string[] {
  const scripts: string[] = [];
  const lang = pageLocale(meta);
  const localizedHome = absoluteUrl(buildLocalePath(lang, "home"));
  const localizedDescription = lang === "en" ? EN_DEFAULT_DESCRIPTION : DEFAULT_DESCRIPTION;
  const sameAs = validSocialLinks(settings?.socialLinks).map((link) => link.url);
  const email = settings?.contactEmail?.trim();
  const telephone = settings?.contactPhone?.trim();

  scripts.push(
    jsonLdScript({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Works.",
      legalName: organizationIdentity.legalName,
      url: SITE_URL,
      logo: absoluteUrl(organizationIdentity.logoPath),
      address: organizationIdentity.address,
      ...(email ? { email } : {}),
      ...(telephone ? { telephone } : {}),
      description: localizedDescription,
      ...(sameAs.length ? { sameAs } : {}),
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

  const content = routeContent(meta, supplied);
  const route = meta.path ? matchLocalePath(meta.path) : null;
  const slug = route?.slug ? decodeURIComponent(route.slug) : "";
  const url = meta.path ? absoluteUrl(meta.path) : "";
  if (route?.routeKey === "serviceDetail" && content.service?.slug === slug) {
    const service = content.service;
    scripts.push(jsonLdScript({
      "@context": "https://schema.org", "@type": "Service",
      name: service.title, description: service.heroDescription,
      url, inLanguage: lang,
      provider: { "@type": "Organization", name: "Works.", url: SITE_URL },
    }));
    // Only the Q&A rendered on this service detail page may be marked as FAQ.
    const questions = service.faqSection?.items.filter((item) => item.question?.trim() && item.answer?.trim()) || [];
    if (questions.length) scripts.push(jsonLdScript({
      "@context": "https://schema.org", "@type": "FAQPage",
      inLanguage: lang, url,
      mainEntity: questions.map((item) => ({
        "@type": "Question", name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    }));
  }

  if (route?.routeKey === "careerDetail" && content.position?.slug === slug &&
      content.position.title?.trim() && (content.position.excerpt?.trim() || content.position.content?.length)) {
    const position = content.position;
    const description = position.content?.filter((block) => block.type !== "image")
      .map((block) => block.content).filter(Boolean).join("\n\n") || position.excerpt;
    // The positions collection contains only active, published Strapi records.
    // Only these explicit job-copy statements establish a Budapest office.
    // Do not mistake the registered/mailing address or generic UI label for
    // the office. Other jobs need a structured CMS location.
    const budapestOffice = /\bbudapesti irodai jelenlét\w*|\bBudapest office\b/i.test(description);
    // Strapi's publishedAt is the only sourced publication timestamp.
    scripts.push(jsonLdScript({
      "@context": "https://schema.org", "@type": "JobPosting",
      title: position.title, description,
      url, inLanguage: lang,
      ...(position.publishedAt && !Number.isNaN(Date.parse(position.publishedAt))
        ? { datePosted: position.publishedAt } : {}),
      ...(budapestOffice ? { jobLocation: {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: "Budapest", addressCountry: "HU" },
      } } : {}),
      hiringOrganization: { "@type": "Organization", name: "Works.", sameAs: SITE_URL, logo: absoluteUrl(organizationIdentity.logoPath) },
    }));
  }

  if (route?.routeKey === "about" && content.team?.length) {
    // CMS snapshot names are verified identities; never mark up demo fallback people.
    const verified = new Set(publishedTeam(lang).map((member) => member.name));
    for (const person of content.team) {
      if (!person.name?.trim() || !verified.has(person.name)) continue;
      scripts.push(jsonLdScript({
        "@context": "https://schema.org", "@type": "Person",
        name: person.name, ...(person.title?.trim() ? { jobTitle: person.title } : {}),
        ...(person.image ? { image: absoluteUrl(person.image) } : {}),
        worksFor: { "@type": "Organization", name: "Works.", url: SITE_URL },
      }));
    }
  }

  const listing = route?.routeKey === "projects" ? content.projects :
    route?.routeKey === "blog" ? content.posts : undefined;
  if (listing?.length) {
    const key = route?.routeKey === "projects" ? "projectDetail" : "blogPost";
    scripts.push(jsonLdScript({
      "@context": "https://schema.org", "@type": "ItemList",
      url, inLanguage: lang,
      itemListElement: listing.map((item, index) => ({
        "@type": "ListItem", position: index + 1, name: item.title,
        url: absoluteUrl(buildLocalePath(lang, key, item.slug)),
      })),
    }));
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
    ...(meta.alternates || []).map(
      ({ hreflang, href }) =>
        `<link data-ssr rel="alternate" hreflang="${hreflang}" href="${escaped(href)}" />`,
    ),
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
