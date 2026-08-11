import {
  fallbackProjects,
  fallbackBlogPosts,
  fallbackServices,
  fallbackPositions,
  fallbackHomepage,
  fallbackAboutPage,
  fallbackContactPage,
  fallbackCareerPage,
  fallbackPrivacyPage,
} from "./data/fallback";
import type { SeoOverride } from "./lib/strapi";

export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
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
  "/adatkezeles": fallbackPrivacyPage?.seo,
};

export function getPageMeta(route: string): PageMeta {
  if (staticMeta[route]) {
    return withOverride(staticMeta[route], pageSeoOverrides[route]);
  }

  const projectMatch = route.match(/^\/projektek\/(.+)$/);
  if (projectMatch) {
    const project = fallbackProjects.find((p) => p.slug === projectMatch[1]);
    if (project) {
      return withOverride(
        {
          title: formatTitle(project.title),
          description: project.caseStudy.heroSubtitle,
          ogImage: project.image,
        },
        project.seo
      );
    }
  }

  const blogMatch = route.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const post = fallbackBlogPosts.find((p) => p.slug === blogMatch[1]);
    if (post) {
      return withOverride(
        {
          title: formatTitle(post.title),
          description: post.excerpt,
          ogImage: post.image,
        },
        post.seo
      );
    }
  }

  const serviceMatch = route.match(/^\/szolgaltatasok\/(.+)$/);
  if (serviceMatch) {
    const service = fallbackServices.find((s) => s.slug === serviceMatch[1]);
    if (service) {
      return withOverride(
        {
          title: formatTitle(service.title),
          description: service.heroDescription,
        },
        service.seo
      );
    }
  }

  const careerMatch = route.match(/^\/karrier\/(.+)$/);
  if (careerMatch) {
    const position = fallbackPositions.find((p) => p.slug === careerMatch[1]);
    if (position) {
      return withOverride(
        {
          title: formatTitle(`${position.title} — Karrier`),
          description: position.excerpt,
        },
        position.seo
      );
    }
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

export function buildMetaTags(meta: PageMeta, assetMap?: Map<string, string>): string {
  const escaped = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

  const tags = [
    `<title>${escaped(meta.title)}</title>`,
    `<meta name="description" content="${escaped(meta.description)}" />`,
    `<meta property="og:title" content="${escaped(meta.title)}" />`,
    `<meta property="og:description" content="${escaped(meta.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="hu_HU" />`,
    `<meta property="og:site_name" content="Works." />`,
  ];

  const ogImage = meta.ogImage || DEFAULT_OG_IMAGE;
  tags.push(`<meta property="og:image" content="${escaped(ogImage)}" />`);

  return tags.join("\n    ");
}
