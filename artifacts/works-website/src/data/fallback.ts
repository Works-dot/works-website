import { projects as rawProjects } from "./projects";
import { blogPosts as rawBlogPosts } from "./blog-posts";
import { positions as rawPositions } from "./careers";
import { whyUsCards as rawWhyUsCards } from "./careers";
import { teamMembers as rawTeamMembers } from "./team";
import { galleryImages as rawGalleryImages } from "./team";
import { services as rawServices } from "./services";
import type {
  Project,
  BlogPost,
  CareerPosition,
  WhyUsCard,
  TeamMember,
  GalleryImage,
  Service,
  GlobalSettings,
  ContactPageData,
  HomepageData,
  Client,
  AboutPageData,
  CareerPageData,
} from "@/lib/strapi";

import rawCache from "./strapi-cache.json";

import logoFallbackImg from "@assets/New_logo_1773998946128.png";
import heroBackgroundFallbackImg from "@assets/works-background_1774441334981.png";
import bgGraphic1FallbackImg from "@assets/bg_graphic_1774009634501.png";
import bgGraphic2FallbackImg from "@assets/bg_graphic2_1774011568340.png";
import aboutGraphicFallbackImg from "@assets/Purposeful_1774354143676.png";
import contactGraphicFallbackImg from "@assets/contact-bg_1774518452836.png";
import careerGraphicFallbackImg from "@assets/Frame_26081029_1774516588825.png";
import serviceBgFallbackImg from "@assets/service-bg_1774270906434.png";
import homepageGraphicFallbackImg from "@assets/homepage_graphic_1773999340930.png";

export {
  logoFallbackImg,
  heroBackgroundFallbackImg,
  bgGraphic1FallbackImg,
  bgGraphic2FallbackImg,
  aboutGraphicFallbackImg,
  contactGraphicFallbackImg,
  careerGraphicFallbackImg,
  serviceBgFallbackImg,
  homepageGraphicFallbackImg,
};

const strapiCache: Record<string, unknown> = rawCache as Record<string, unknown>;

function hasData(key: string): boolean {
  const val = strapiCache[key];
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return Object.keys(val as Record<string, unknown>).length > 0;
  return true;
}

const hardcodedProjects: Project[] = rawProjects.map((p) => ({
  slug: p.slug,
  title: p.title,
  tags: p.tags,
  description: p.description,
  image: p.image,
  homepageImage: p.homepageImage,
  featured: p.featured,
  caseStudy: {
    heroSubtitle: p.caseStudy.heroSubtitle,
    client: p.caseStudy.client,
    year: p.caseStudy.year,
    duration: p.caseStudy.duration,
    blocks: p.caseStudy.blocks.map((b) => ({
      type: b.type,
      content: b.content,
      caption: b.caption,
    })),
  },
}));

const hardcodedBlogPosts: BlogPost[] = rawBlogPosts.map((bp) => ({
  slug: bp.slug,
  title: bp.title,
  excerpt: bp.excerpt,
  date: bp.date,
  author: bp.author,
  image: bp.image,
  tags: bp.tags,
  readingTime: bp.readingTime,
  content: bp.content.map((b) => ({
    type: b.type,
    content: b.content,
    caption: b.caption,
  })),
}));

const hardcodedPositions: CareerPosition[] = rawPositions.map((cp) => ({
  slug: cp.slug,
  title: cp.title,
  team: cp.team,
  location: "Budapest / Hybrid",
  type: "Teljes munkaidő",
  tags: cp.tags,
  excerpt: cp.excerpt,
  content: cp.content.map((b) => ({
    type: b.type,
    content: b.content,
    caption: b.caption,
  })),
}));

const hardcodedWhyUsCards: WhyUsCard[] = rawWhyUsCards.map((c) => ({
  image: c.image,
  title: c.title,
  description: c.description,
}));

const hardcodedTeamMembers: TeamMember[] = rawTeamMembers.map((m) => ({
  name: m.name,
  title: m.title,
  image: m.image,
}));

const hardcodedGalleryImages: GalleryImage[] = rawGalleryImages.map(
  (g) => ({
    src: g.src,
    alt: g.alt,
  })
);

const hardcodedServices: Service[] = rawServices.map((s) => ({
  slug: s.slug,
  title: s.title,
  subtitle: s.subtitle,
  heroDescription: s.heroDescription,
  valueQuestion: s.valueQuestion,
  valueAnswer: s.valueAnswer,
  heroImage: serviceBgFallbackImg,
  icon: "",
  activities: s.activities.map((a) => ({ ...a, icon: "" })),
  benefits: s.benefits.map((b) => ({ ...b, icon: "" })),
  tools: s.tools.map((t: string) => ({ name: t })),
  howWeWork: s.howWeWork,
  relatedProjectSlugs: s.relatedProjectSlugs,
}));

const hardcodedGlobalSettings: GlobalSettings = {
  siteName: "Works.",
  contactEmail: "hello@works.hu",
  contactPhone: "+36 1 234 5678",
  address: "1054 Budapest, Szabadság tér 7.",
  footerTagline: "Digitális élményeket tervezünk, amelyek valódi értéket teremtenek.",
  copyrightText: "© 2024 Works. Minden jog fenntartva.",
  newsletterHeading: "Iratkozz fel hírlevelünkre",
  newsletterDescription: "Kapj értesítést a legfrissebb UX trendekről és esettanulmányainkról.",
  heroBackgroundPatternUrl: heroBackgroundFallbackImg,
  logoUrl: logoFallbackImg,
  bgGraphic1Url: bgGraphic1FallbackImg,
  bgGraphic2Url: bgGraphic2FallbackImg,
  faviconUrl: logoFallbackImg,
  ogImageUrl: heroBackgroundFallbackImg,
  openingHours: [
    { day: "Hétfő – Péntek", hours: "9:00 – 18:00" },
    { day: "Szombat – Vasárnap", hours: "Zárva" },
  ],
  socialLinks: [
    { platform: "LinkedIn", url: "https://linkedin.com/company/works-agency" },
    { platform: "Instagram", url: "https://instagram.com/works.agency" },
    { platform: "Facebook", url: "https://facebook.com/works.agency" },
  ],
};

const hardcodedContactPage: ContactPageData = {
  hero: {
    heading: "Kapcsolat",
    description: "Beszéljünk a következő projektedről!",
    backgroundImage: contactGraphicFallbackImg,
  },
  formHeading: "",
  successTitle: "",
  successMessage: "",
  mapHeading: "",
  mapEmbedUrl: "",
  backgroundImage: contactGraphicFallbackImg,
  formSubjects: [
    { label: "UX kutatás", value: "ux-kutatas" },
    { label: "UI design", value: "ui-design" },
    { label: "Webfejlesztés", value: "webfejlesztes" },
    { label: "Akadálymentesítés", value: "akadalymentesites" },
    { label: "Egyéb", value: "egyeb" },
  ],
};

const hardcodedHomepage: HomepageData = {
  hero: {
    heading: "Digitális élményeket tervezünk",
    highlightedWord: "élményeket",
    description: "UX kutatás, UI design és fejlesztés — egy csapattól. Segítünk, hogy digitális termékeid valódi értéket teremtsenek.",
    primaryCtaText: "Projektjeink",
    primaryCtaLink: "#projects",
    secondaryCtaText: "Kapcsolat",
    secondaryCtaLink: "/kapcsolat",
    backgroundImage: heroBackgroundFallbackImg,
  },
  servicesSection: {
    heading: "Miben tudunk segíteni?",
  },
  projectsSection: {
    heading: "Kiemelt projektjeink",
  },
  blogSection: {
    heading: "Blog",
  },
};

const hardcodedAboutPage: AboutPageData = {
  hero: {
    heading: "Rólunk.",
    description: "Egy magyar digitális ügynökség vagyunk, akik hisznek abban, hogy a jó design kutatáson alapul, és a technológia az embereket szolgálja.",
    backgroundImage: aboutGraphicFallbackImg,
  },
  intro: {
    heading: "Kik vagyunk?",
    description: "A Works. 2018-ban indult azzal a céllal, hogy a magyar digitális piacra világszínvonalú UX kutatást és design megoldásokat hozzon.",
  },
};

const hardcodedCareerPage: CareerPageData = {
  hero: {
    heading: "Karrier.",
    description: "Csatlakozz egy csapathoz, ahol a design kutatáson alapul, a technológia az embereket szolgálja, és minden nap tanulhatsz valami újat.",
    backgroundImage: careerGraphicFallbackImg,
  },
  workWithUs: {
    heading: "Dolgozz velünk",
    description: "A Works. egy magyar digitális ügynökség, ahol UX kutatók, designerek, fejlesztők és stratégák dolgoznak együtt azon, hogy a digitális világot egy kicsit jobbá tegyék. Nálunk minden projekt a felhasználók megértésével indul, és a megvalósítás minőségével zárul.\n\nHiszünk abban, hogy a legjobb munkát inspiráló környezetben, erős csapatban és valódi szabadsággal lehet végezni. Ha te is így gondolod, nézd meg nyitott pozícióinkat.",
  },
  whyUs: {
    sectionHeading: "Miért jó nálunk dolgozni?",
    items: hardcodedWhyUsCards,
  },
};

export const fallbackProjects: Project[] = hasData("projects")
  ? (strapiCache.projects as Project[])
  : hardcodedProjects;

export const fallbackBlogPosts: BlogPost[] = hasData("blogPosts")
  ? (strapiCache.blogPosts as BlogPost[])
  : hardcodedBlogPosts;

export const fallbackPositions: CareerPosition[] = hasData("positions")
  ? (strapiCache.positions as CareerPosition[])
  : hardcodedPositions;

export const fallbackTeamMembers: TeamMember[] = hasData("teamMembers")
  ? (strapiCache.teamMembers as TeamMember[])
  : hardcodedTeamMembers;

export const fallbackGalleryImages: GalleryImage[] = hasData("galleryImages")
  ? (strapiCache.galleryImages as GalleryImage[])
  : hardcodedGalleryImages;

export const fallbackServices: Service[] = hasData("services")
  ? (strapiCache.services as Service[])
  : hardcodedServices;

export const fallbackGlobalSettings: GlobalSettings = hasData("globalSettings")
  ? (strapiCache.globalSettings as GlobalSettings)
  : hardcodedGlobalSettings;

export const fallbackContactPage: ContactPageData = hasData("contactPage")
  ? (strapiCache.contactPage as ContactPageData)
  : hardcodedContactPage;

export const fallbackHomepage: HomepageData = hasData("homepage")
  ? (strapiCache.homepage as HomepageData)
  : hardcodedHomepage;

export const fallbackClients: Client[] = hasData("clients")
  ? (strapiCache.clients as Client[])
  : [];

export const fallbackAboutPage: AboutPageData = hasData("aboutPage")
  ? (strapiCache.aboutPage as AboutPageData)
  : hardcodedAboutPage;

export const fallbackCareerPage: CareerPageData = (() => {
  if (!hasData("careerPage")) return hardcodedCareerPage;
  const cached = strapiCache.careerPage as Partial<CareerPageData>;
  return {
    hero: cached.hero ?? hardcodedCareerPage.hero,
    workWithUs: cached.workWithUs?.heading
      ? cached.workWithUs as CareerPageData["workWithUs"]
      : hardcodedCareerPage.workWithUs,
    whyUs: cached.whyUs?.items?.length
      ? cached.whyUs as CareerPageData["whyUs"]
      : hardcodedCareerPage.whyUs,
  };
})();
