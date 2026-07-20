import { mapContentBlocks, strapiImageUrl } from "./content-blocks.js";

const STRAPI_API = "/strapi/api";

function getPreviewStatus(): "draft" | null {
  if (typeof window === "undefined") return null;
  const status = new URLSearchParams(window.location.search).get("status");
  return status === "draft" ? "draft" : null;
}

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${window.location.origin}${STRAPI_API}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const previewStatus = getPreviewStatus();
  if (previewStatus) url.searchParams.set("status", previewStatus);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Strapi API error: ${res.status} ${res.statusText}`);
  return res.json();
}

interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
}

interface StrapiSingleResponse<T> {
  data: T;
}

interface StrapiMedia {
  id: number;
  url: string;
  formats?: Record<string, { url: string; width: number; height: number }>;
  width?: number;
  height?: number;
  alternativeText?: string;
}

interface StrapiTag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

interface StrapiCaseStudy {
  heroSubtitle: string;
  client: string;
  year: string;
  duration: string;
}

interface StrapiContentBlock {
  __component: string;
  id: number;
  body?: string;
  quote?: string;
  image?: StrapiMedia;
  caption?: string;
}

interface StrapiProject {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  description: string;
  image: StrapiMedia | null;
  homepageImage: StrapiMedia | null;
  featured: boolean;
  order: number | null;
  tags: StrapiTag[];
  caseStudy: StrapiCaseStudy | null;
  contentBlocks: StrapiContentBlock[];
}

interface StrapiTeamMember {
  id: number;
  documentId: string;
  name: string;
  title: string;
  image: StrapiMedia | null;
  order: number;
}

interface StrapiBlogPost {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: StrapiTeamMember | null;
  image: StrapiMedia | null;
  tags: StrapiTag[];
  readingTime: string;
  contentBlocks: StrapiContentBlock[];
}

interface StrapiServiceGeneral {
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  icon: StrapiMedia | null;
  heroImage: StrapiMedia | null;
}

interface StrapiSectionIntro {
  kicker: string | null;
  heading: string | null;
  description: string | null;
}

interface StrapiQuestionCard {
  title: string;
  description: string | null;
}

interface StrapiHelpCard {
  title: string;
  description: string | null;
  icon: StrapiMedia | null;
}

interface StrapiProcessStep {
  title: string;
  description: string | null;
}

interface StrapiDeliverableCard {
  title: string;
  description: string | null;
  icon: StrapiMedia | null;
}

interface StrapiDeliverableGroup {
  title: string;
  description: string | null;
  icon: StrapiMedia | null;
  bullets: { text: string }[];
}

interface StrapiFaqItem {
  question: string;
  answer: string | null;
}

interface StrapiService {
  id: number;
  documentId: string;
  general: (StrapiServiceGeneral & { kicker?: string | null }) | null;
  relatedProjects: StrapiProject[];
  order: number;
  questionsSection: { intro: StrapiSectionIntro | null; cards: StrapiQuestionCard[] } | null;
  helpSection: {
    intro: StrapiSectionIntro | null;
    cards: StrapiHelpCard[];
    ctaText: string | null;
    ctaButtonText: string | null;
    ctaButtonLink: string | null;
  } | null;
  processSection: { intro: StrapiSectionIntro | null; steps: StrapiProcessStep[] } | null;
  deliverablesSection: {
    intro: StrapiSectionIntro | null;
    variant: "smallCards" | "largeCards";
    smallCards: StrapiDeliverableCard[];
    largeCards: StrapiDeliverableGroup[];
  } | null;
  projectExamplesIntro: StrapiSectionIntro | null;
  faqSection: { intro: StrapiSectionIntro | null; items: StrapiFaqItem[] } | null;
  relatedServicesIntro: StrapiSectionIntro | null;
  relatedServices: { general: (StrapiServiceGeneral & { kicker?: string | null }) | null }[];
}

interface StrapiClient {
  id: number;
  documentId: string;
  name: string;
  initials: string;
  logo: StrapiMedia | null;
  order: number;
  featured: boolean;
}


interface StrapiCareerPosition {
  id: number;
  documentId: string;
  slug: string;
  title: string;
  team: string;
  tags: StrapiTag[];
  excerpt: string;
  isActive: boolean;
  contentBlocks: StrapiContentBlock[];
}

export interface ContentBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
}

export interface Project {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
  homepageImage?: string;
  featured?: boolean;
  order?: number | null;
  caseStudy: {
    heroSubtitle: string;
    client: string;
    year: string;
    duration: string;
    blocks: ContentBlock[];
  };
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  readingTime: string;
  content: ContentBlock[];
}

export interface TeamMember {
  name: string;
  title: string;
  image: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface SectionIntro {
  kicker: string;
  heading: string;
  description: string;
}

export interface ServiceQuestionsSection {
  intro: SectionIntro | null;
  cards: { title: string; description: string }[];
}

export interface ServiceHelpSection {
  intro: SectionIntro | null;
  cards: { title: string; description: string; icon: string }[];
  ctaText: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export interface ServiceProcessSection {
  intro: SectionIntro | null;
  steps: { title: string; description: string }[];
}

export interface ServiceDeliverablesSection {
  intro: SectionIntro | null;
  variant: "smallCards" | "largeCards";
  smallCards: { title: string; description: string; icon: string }[];
  largeCards: { title: string; description: string; icon: string; bullets: string[] }[];
}

export interface ServiceFaqSection {
  intro: SectionIntro | null;
  items: { question: string; answer: string }[];
}

export interface RelatedServiceSummary {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export interface Service {
  slug: string;
  title: string;
  subtitle: string;
  kicker: string;
  heroDescription: string;
  heroImage: string;
  icon: string;
  relatedProjectSlugs: string[];
  questionsSection: ServiceQuestionsSection | null;
  helpSection: ServiceHelpSection | null;
  processSection: ServiceProcessSection | null;
  deliverablesSection: ServiceDeliverablesSection | null;
  projectExamplesIntro: SectionIntro | null;
  faqSection: ServiceFaqSection | null;
  relatedServicesIntro: SectionIntro | null;
  relatedServices: RelatedServiceSummary[];
}

export interface Client {
  name: string;
  initials: string;
  logo?: string;
  order: number;
  featured: boolean;
}

export interface WhyUsCard {
  image: string;
  title: string;
  description: string;
}

export interface CareerWhyUsSection {
  sectionHeading: string;
  items: WhyUsCard[];
}

export interface CareerWorkWithUs {
  heading: string;
  description: string;
}

export interface CareerPosition {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  tags: string[];
  excerpt: string;
  content: ContentBlock[];
}

const CAREER_LOCATION = "Budapest / Hybrid";
const CAREER_TYPE = "Teljes munkaidő";

function mapProject(p: StrapiProject): Project {
  return {
    slug: p.slug,
    title: p.title,
    tags: p.tags?.map((t) => t.name) || [],
    description: p.description || "",
    image: strapiImageUrl(p.image?.url),
    homepageImage: p.homepageImage ? strapiImageUrl(p.homepageImage.url) : undefined,
    featured: p.featured,
    order: p.order ?? null,
    caseStudy: {
      heroSubtitle: p.caseStudy?.heroSubtitle || "",
      client: p.caseStudy?.client || "",
      year: p.caseStudy?.year || "",
      duration: p.caseStudy?.duration || "",
      blocks: mapContentBlocks(p.contentBlocks),
    },
  };
}

function mapBlogPost(p: StrapiBlogPost): BlogPost {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || "",
    date: p.date || "",
    author: p.author?.name || "",
    image: strapiImageUrl(p.image?.url),
    tags: p.tags?.map((t) => t.name) || [],
    readingTime: p.readingTime || "",
    content: mapContentBlocks(p.contentBlocks),
  };
}

const PROJECT_POPULATE =
  "populate[0]=image&populate[1]=homepageImage&populate[2]=tags&populate[3]=caseStudy&populate[4]=contentBlocks.image";

export async function getProjects(): Promise<Project[]> {
  const res = await fetchApi<StrapiListResponse<StrapiProject>>(
    `/projects?${PROJECT_POPULATE}&pagination[pageSize]=100&sort[0]=order:asc&sort[1]=createdAt:asc`
  );
  return res.data.map(mapProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const res = await fetchApi<StrapiListResponse<StrapiProject>>(
    `/projects?${PROJECT_POPULATE}&filters[slug][$eq]=${encodeURIComponent(slug)}`
  );
  return res.data[0] ? mapProject(res.data[0]) : null;
}

export function getNextProject(projects: Project[], currentSlug: string): Project {
  const idx = projects.findIndex((p) => p.slug === currentSlug);
  return projects[(idx + 1) % projects.length];
}

const BLOG_POPULATE =
  "populate[0]=image&populate[1]=tags&populate[2]=contentBlocks.image&populate[3]=author";

export async function getBlogPosts(): Promise<BlogPost[]> {
  const res = await fetchApi<StrapiListResponse<StrapiBlogPost>>(
    `/blog-posts?${BLOG_POPULATE}&pagination[pageSize]=100&sort=date:desc`
  );
  return res.data.map(mapBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await fetchApi<StrapiListResponse<StrapiBlogPost>>(
    `/blog-posts?${BLOG_POPULATE}&filters[slug][$eq]=${encodeURIComponent(slug)}`
  );
  return res.data[0] ? mapBlogPost(res.data[0]) : null;
}

export function getNextBlogPost(posts: BlogPost[], currentSlug: string): BlogPost {
  const idx = posts.findIndex((p) => p.slug === currentSlug);
  return posts[(idx + 1) % posts.length];
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const res = await fetchApi<StrapiListResponse<StrapiTeamMember>>(
    "/team-members?populate[0]=image&pagination[pageSize]=100&sort=order:asc"
  );
  return res.data.map((m) => ({
    name: m.name,
    title: m.title,
    image: strapiImageUrl(m.image?.url),
  }));
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const res = await fetchApi<StrapiSingleResponse<{ galleryImages: StrapiMedia[] }>>(
    "/about-page?populate[0]=galleryImages"
  );
  return (res.data?.galleryImages || []).map((img) => ({
    src: strapiImageUrl(img.url),
    alt: img.alternativeText || "",
  }));
}

const SERVICE_POPULATE =
  "populate[0]=general&populate[1]=general.icon&populate[2]=general.heroImage&populate[3]=relatedProjects&populate[4]=seo" +
  "&populate[5]=questionsSection.intro&populate[6]=questionsSection.cards" +
  "&populate[7]=helpSection.intro&populate[8]=helpSection.cards.icon" +
  "&populate[9]=processSection.intro&populate[10]=processSection.steps" +
  "&populate[11]=deliverablesSection.intro&populate[12]=deliverablesSection.smallCards.icon&populate[13]=deliverablesSection.largeCards.icon&populate[14]=deliverablesSection.largeCards.bullets" +
  "&populate[15]=projectExamplesIntro&populate[16]=faqSection.intro&populate[17]=faqSection.items" +
  "&populate[18]=relatedServicesIntro&populate[19]=relatedServices.general.icon";

function mapSectionIntro(i: StrapiSectionIntro | null | undefined): SectionIntro | null {
  if (!i) return null;
  return {
    kicker: i.kicker || "",
    heading: i.heading || "",
    description: i.description || "",
  };
}

function mapService(s: StrapiService): Service {
  return {
    slug: s.general?.slug || "",
    title: s.general?.title || "",
    subtitle: s.general?.subtitle || "",
    kicker: s.general?.kicker || "",
    heroDescription: s.general?.heroDescription || "",
    heroImage: strapiImageUrl(s.general?.heroImage?.url),
    icon: strapiImageUrl(s.general?.icon?.url),
    relatedProjectSlugs: (s.relatedProjects || []).map((p) => p.slug),
    questionsSection: s.questionsSection
      ? {
          intro: mapSectionIntro(s.questionsSection.intro),
          cards: (s.questionsSection.cards || []).map((c) => ({
            title: c.title,
            description: c.description || "",
          })),
        }
      : null,
    helpSection: s.helpSection
      ? {
          intro: mapSectionIntro(s.helpSection.intro),
          cards: (s.helpSection.cards || []).map((c) => ({
            title: c.title,
            description: c.description || "",
            icon: strapiImageUrl(c.icon?.url),
          })),
          ctaText: s.helpSection.ctaText || "",
          ctaButtonText: s.helpSection.ctaButtonText || "",
          ctaButtonLink: s.helpSection.ctaButtonLink || "",
        }
      : null,
    processSection: s.processSection
      ? {
          intro: mapSectionIntro(s.processSection.intro),
          steps: (s.processSection.steps || []).map((st) => ({
            title: st.title,
            description: st.description || "",
          })),
        }
      : null,
    deliverablesSection: s.deliverablesSection
      ? {
          intro: mapSectionIntro(s.deliverablesSection.intro),
          variant: s.deliverablesSection.variant === "largeCards" ? "largeCards" : "smallCards",
          smallCards: (s.deliverablesSection.smallCards || []).map((c) => ({
            title: c.title,
            description: c.description || "",
            icon: strapiImageUrl(c.icon?.url),
          })),
          largeCards: (s.deliverablesSection.largeCards || []).map((c) => ({
            title: c.title,
            description: c.description || "",
            icon: strapiImageUrl(c.icon?.url),
            bullets: (c.bullets || []).map((b) => b.text),
          })),
        }
      : null,
    projectExamplesIntro: mapSectionIntro(s.projectExamplesIntro),
    faqSection: s.faqSection
      ? {
          intro: mapSectionIntro(s.faqSection.intro),
          items: (s.faqSection.items || []).map((it) => ({
            question: it.question,
            answer: it.answer || "",
          })),
        }
      : null,
    relatedServicesIntro: mapSectionIntro(s.relatedServicesIntro),
    relatedServices: (s.relatedServices || [])
      .filter((r) => r.general?.slug)
      .map((r) => ({
        slug: r.general?.slug || "",
        title: r.general?.title || "",
        description: r.general?.heroDescription || "",
        icon: strapiImageUrl(r.general?.icon?.url),
      })),
  };
}

export async function getServices(): Promise<Service[]> {
  const res = await fetchApi<StrapiListResponse<StrapiService>>(
    `/services?${SERVICE_POPULATE}&pagination[pageSize]=100&sort=order:asc`
  );
  return res.data.map(mapService);
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const res = await fetchApi<StrapiListResponse<StrapiService>>(
    `/services?${SERVICE_POPULATE}&filters[general][slug][$eq]=${encodeURIComponent(slug)}`
  );
  return res.data[0] ? mapService(res.data[0]) : null;
}

export async function getClients(): Promise<Client[]> {
  const res = await fetchApi<StrapiListResponse<StrapiClient>>(
    "/clients?populate[0]=logo&pagination[pageSize]=100&sort=order:asc"
  );
  return res.data.map((c) => ({
    name: c.name,
    initials: c.initials || "",
    logo: c.logo ? strapiImageUrl(c.logo.url) : undefined,
    order: c.order,
    featured: c.featured,
  }));
}


const CAREER_POPULATE = "populate[0]=tags&populate[1]=contentBlocks&populate[2]=contentBlocks.image";

export async function getCareerPositions(): Promise<CareerPosition[]> {
  const res = await fetchApi<StrapiListResponse<StrapiCareerPosition>>(
    `/career-positions?${CAREER_POPULATE}&pagination[pageSize]=100&filters[isActive][$eq]=true`
  );
  return res.data.map((c) => ({
    slug: c.slug,
    title: c.title,
    team: c.team || "",
    location: CAREER_LOCATION,
    type: CAREER_TYPE,
    tags: c.tags?.map((t) => t.name) || [],
    excerpt: c.excerpt || "",
    content: mapContentBlocks(c.contentBlocks),
  }));
}

export async function getCareerPositionBySlug(slug: string): Promise<CareerPosition | null> {
  const res = await fetchApi<StrapiListResponse<StrapiCareerPosition>>(
    `/career-positions?${CAREER_POPULATE}&filters[slug][$eq]=${encodeURIComponent(slug)}`
  );
  return res.data[0]
    ? {
        slug: res.data[0].slug,
        title: res.data[0].title,
        team: res.data[0].team || "",
        location: CAREER_LOCATION,
        type: CAREER_TYPE,
        tags: res.data[0].tags?.map((t) => t.name) || [],
        excerpt: res.data[0].excerpt || "",
        content: mapContentBlocks(res.data[0].contentBlocks),
      }
    : null;
}

export function getNextPosition(positions: CareerPosition[], currentSlug: string): CareerPosition {
  const idx = positions.findIndex((p) => p.slug === currentSlug);
  return positions[(idx + 1) % positions.length];
}

export interface HomepageData {
  hero: {
    heading: string;
    highlightedWord: string;
    description: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundImage: string;
  };
  servicesSection: { heading: string };
  projectsSection: { heading: string };
  blogSection: { heading: string };
  ctaBanner: { heading: string; ctaText: string; ctaLink: string };
}

export async function getHomepage(): Promise<HomepageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: {
      heading: string;
      highlightedWord: string;
      description: string;
      primaryCtaText: string;
      primaryCtaLink: string;
      secondaryCtaText: string;
      secondaryCtaLink: string;
      backgroundImage: StrapiMedia | null;
    };
    servicesSection: HomepageData["servicesSection"];
    projectsSection: HomepageData["projectsSection"];
    blogSection: HomepageData["blogSection"];
    ctaBanner: HomepageData["ctaBanner"] | null;
  }>>("/homepage?populate[0]=hero&populate[1]=servicesSection&populate[2]=projectsSection&populate[3]=blogSection&populate[4]=hero.backgroundImage&populate[5]=ctaBanner");
  const d = res.data;
  const h = d.hero;
  return {
    hero: h ? {
      heading: h.heading || "",
      highlightedWord: h.highlightedWord || "",
      description: h.description || "",
      primaryCtaText: h.primaryCtaText || "",
      primaryCtaLink: h.primaryCtaLink || "",
      secondaryCtaText: h.secondaryCtaText || "",
      secondaryCtaLink: h.secondaryCtaLink || "",
      backgroundImage: strapiImageUrl(h.backgroundImage?.url),
    } : { heading: "", highlightedWord: "", description: "", primaryCtaText: "", primaryCtaLink: "", secondaryCtaText: "", secondaryCtaLink: "", backgroundImage: "" },
    servicesSection: d.servicesSection || { heading: "" },
    projectsSection: d.projectsSection || { heading: "" },
    blogSection: d.blogSection || { heading: "" },
    ctaBanner: d.ctaBanner
      ? {
          heading: d.ctaBanner.heading || "",
          ctaText: d.ctaBanner.ctaText || "",
          ctaLink: d.ctaBanner.ctaLink || "",
        }
      : { heading: "", ctaText: "", ctaLink: "" },
  };
}

export interface ContactPageData {
  hero: { heading: string; description: string; backgroundImage: string };
  formHeading: string;
  successTitle: string;
  successMessage: string;
  mapHeading: string;
  mapEmbedUrl: string;
  formSubjects: { label: string; value: string }[];
  backgroundImage: string;
}

export async function getContactPage(): Promise<ContactPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: { heading: string; description: string; backgroundImage: StrapiMedia | null };
    formHeading: string;
    successTitle: string;
    successMessage: string;
    mapHeading: string;
    mapEmbedUrl: string;
    formSubjects: { id: number; label: string; value: string }[];
    backgroundImage: StrapiMedia | null;
  }>>("/contact-page?populate[0]=hero&populate[1]=formSubjects&populate[2]=hero.backgroundImage&populate[3]=backgroundImage");
  const d = res.data;
  return {
    hero: {
      heading: d.hero?.heading || "",
      description: d.hero?.description || "",
      backgroundImage: strapiImageUrl(d.hero?.backgroundImage?.url),
    },
    formHeading: d.formHeading || "",
    successTitle: d.successTitle || "",
    successMessage: d.successMessage || "",
    mapHeading: d.mapHeading || "",
    mapEmbedUrl: d.mapEmbedUrl || "",
    formSubjects: (d.formSubjects || []).map((s) => ({ label: s.label, value: s.value })),
    backgroundImage: strapiImageUrl(d.backgroundImage?.url),
  };
}

export interface GlobalSettings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  footerTagline: string;
  copyrightText: string;
  newsletterHeading: string;
  newsletterDescription: string;
  heroBackgroundPatternUrl: string;
  logoUrl: string;
  bgGraphic1Url: string;
  bgGraphic2Url: string;
  faviconUrl: string;
  ogImageUrl: string;
  socialLinks: { platform: string; url: string }[];
  openingHours: { day: string; hours: string }[];
}

export async function getGlobalSettings(): Promise<GlobalSettings> {
  const res = await fetchApi<StrapiSingleResponse<{
    siteName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    footerTagline: string;
    copyrightText: string;
    newsletterHeading: string;
    newsletterDescription: string;
    heroBackgroundPattern: { url: string } | null;
    logo: { url: string } | null;
    bgGraphic1: { url: string } | null;
    bgGraphic2: { url: string } | null;
    favicon: { url: string } | null;
    ogImage: { url: string } | null;
    socialLinks: { id: number; platform: string; url: string }[];
    openingHours: { id: number; day: string; hours: string }[];
  }>>("/global-setting?populate[0]=socialLinks&populate[1]=openingHours&populate[2]=heroBackgroundPattern&populate[3]=logo&populate[4]=bgGraphic1&populate[5]=bgGraphic2&populate[6]=favicon&populate[7]=ogImage");
  const d = res.data;
  return {
    siteName: d.siteName || "",
    contactEmail: d.contactEmail || "",
    contactPhone: d.contactPhone || "",
    address: d.address || "",
    footerTagline: d.footerTagline || "",
    copyrightText: d.copyrightText || "",
    newsletterHeading: d.newsletterHeading || "",
    newsletterDescription: d.newsletterDescription || "",
    heroBackgroundPatternUrl: d.heroBackgroundPattern?.url ? strapiImageUrl(d.heroBackgroundPattern.url) : "",
    logoUrl: d.logo?.url ? strapiImageUrl(d.logo.url) : "",
    bgGraphic1Url: d.bgGraphic1?.url ? strapiImageUrl(d.bgGraphic1.url) : "",
    bgGraphic2Url: d.bgGraphic2?.url ? strapiImageUrl(d.bgGraphic2.url) : "",
    faviconUrl: d.favicon?.url ? strapiImageUrl(d.favicon.url) : "",
    ogImageUrl: d.ogImage?.url ? strapiImageUrl(d.ogImage.url) : "",
    socialLinks: (d.socialLinks || []).map((s) => ({ platform: s.platform, url: s.url })),
    openingHours: (d.openingHours || []).map((o) => ({ day: o.day, hours: o.hours })),
  };
}

export interface AboutPageData {
  hero: { heading: string; description: string; backgroundImage: string };
  intro: { heading: string; description: string };
}

export async function getAboutPage(): Promise<AboutPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: { heading: string; description: string; backgroundImage: StrapiMedia | null };
    intro: { heading: string; body: string } | null;
  }>>("/about-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=intro");
  const d = res.data;
  return {
    hero: {
      heading: d.hero?.heading || "",
      description: d.hero?.description || "",
      backgroundImage: strapiImageUrl(d.hero?.backgroundImage?.url),
    },
    intro: {
      heading: d.intro?.heading || "",
      description: d.intro?.body || "",
    },
  };
}

export interface CareerPageData {
  hero: { heading: string; description: string; backgroundImage: string };
  workWithUs: CareerWorkWithUs;
  whyUs: CareerWhyUsSection;
}

export async function getCareerPage(): Promise<CareerPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: { heading: string; description: string; backgroundImage: StrapiMedia | null };
    workWithUs: { heading: string; description: string } | null;
    whyUs: {
      sectionHeading: string;
      items: { title: string; description: string; image: StrapiMedia | null }[];
    } | null;
  }>>("/career-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=workWithUs&populate[3]=whyUs&populate[4]=whyUs.items&populate[5]=whyUs.items.image");
  const d = res.data;
  return {
    hero: {
      heading: d.hero?.heading || "",
      description: d.hero?.description || "",
      backgroundImage: strapiImageUrl(d.hero?.backgroundImage?.url),
    },
    workWithUs: {
      heading: d.workWithUs?.heading || "",
      description: d.workWithUs?.description || "",
    },
    whyUs: {
      sectionHeading: d.whyUs?.sectionHeading || "",
      items: (d.whyUs?.items || []).map((item) => ({
        title: item.title,
        description: item.description,
        image: strapiImageUrl(item.image?.url),
      })),
    },
  };
}

export async function getAllProjectTags(): Promise<string[]> {
  const projects = await getProjects();
  const tags = new Set<string>();
  projects.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags);
}

export async function getAllBlogTags(): Promise<string[]> {
  const posts = await getBlogPosts();
  const tags = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags);
}
