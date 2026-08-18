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
    title: seo.metaTitle?.trim() || base.title,
    description: seo.metaDescription?.trim() || base.description,
    ogImage: seo.ogImage || base.ogImage,
  };
}

const DEFAULT_TITLE = "Works. | Digitális Ügynökség";
const DEFAULT_DESCRIPTION =
  "Magyar digitális ügynökség — UX kutatás, service design, UI design, akadálymentesítés, AI-alapú tervezés, webfejlesztés.";
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
};

const pageSeoOverrides: Record<string, SeoOverride | null | undefined> = {
  "/": fallbackHomepage?.seo,
  "/rolunk": fallbackAboutPage?.seo,
  "/kapcsolat": fallbackContactPage?.seo,
  "/karrier": fallbackCareerPage?.seo,
};

export function getPageMeta(route: string): PageMeta {
  if (staticMeta[route]) {
    const base = withOverride(staticMeta[route], pageSeoOverrides[route]);
    return { ...base, path: route, type: "website" };
  }

  const projectMatch = route.match(/^\/projektek\/(.+)$/);
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
        path: route,
        type: "article",
        breadcrumbs: [
          { name: "Projektek", path: "/projektek" },
          { name: project.title, path: route },
        ],
      };
    }
  }

  const blogMatch = route.match(/^\/blog\/(.+)$/);
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
        path: route,
        type: "article",
        article: { publishedTime: post.date, author: post.author || undefined },
        breadcrumbs: [
          { name: "Blog", path: "/blog" },
          { name: post.title, path: route },
        ],
      };
    }
  }

  const serviceMatch = route.match(/^\/szolgaltatasok\/(.+)$/);
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
        path: route,
        type: "website",
        breadcrumbs: [{ name: service.title, path: route }],
      };
    }
  }

  const careerMatch = route.match(/^\/karrier\/(.+)$/);
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
        path: route,
        type: "website",
        breadcrumbs: [
          { name: "Karrier", path: "/karrier" },
          { name: position.title, path: route },
        ],
      };
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, type: "website" };
}

function jsonLdScript(data: object): string {
  // "<" escape-elve, hogy a JSON ne tudjon kitörni a <script> tagből.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

export function buildJsonLd(meta: PageMeta): string[] {
  const scripts: string[] = [];

  scripts.push(
    jsonLdScript({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Works.",
      url: SITE_URL,
      logo: absoluteUrl("/favicon.svg"),
      description: DEFAULT_DESCRIPTION,
    })
  );

  scripts.push(
    jsonLdScript({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Works.",
      url: SITE_URL,
      inLanguage: "hu",
    })
  );

  if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
    scripts.push(
      jsonLdScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Főoldal", item: SITE_URL },
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
      inLanguage: "hu",
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

  // data-ssr jelölés: a kliensoldali SEOHead hidratáláskor eltávolítja ezeket,
  // hogy a Helmet által kezelt tagekkel ne duplikálódjanak.
  const tags = [
    `<title data-ssr>${escaped(meta.title)}</title>`,
    `<meta data-ssr name="description" content="${escaped(meta.description)}" />`,
    ...(canonical ? [`<link data-ssr rel="canonical" href="${escaped(canonical)}" />`] : []),
    `<meta data-ssr property="og:title" content="${escaped(meta.title)}" />`,
    `<meta data-ssr property="og:description" content="${escaped(meta.description)}" />`,
    `<meta data-ssr property="og:type" content="${ogType}" />`,
    ...(canonical ? [`<meta data-ssr property="og:url" content="${escaped(canonical)}" />`] : []),
    `<meta data-ssr property="og:locale" content="hu_HU" />`,
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
