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

/**
 * Appends a Strapi locale query param to a URL string only when `locale` is
 * explicitly provided. This keeps existing no-arg call sites unchanged while
 * allowing callers to pass `"en"`.
 *
 * @internal — used by the parameterized loader functions below.
 */
function appendLocale(url: string, locale?: string): string {
  if (!locale) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}locale=${encodeURIComponent(locale)}`;
}

/**
 * Builds a stable TanStack Query / useStrapiQuery cache key that includes
 * the locale when provided.
 *
 * @example
 *   strapiQueryKey("projects")              // => "projects"
 *   strapiQueryKey("projects", "hu")        // => "projects:hu"
 *   strapiQueryKey("project", "en", "slug") // => "project:en:slug"
 */
export function strapiQueryKey(base: string, locale?: string, ...extra: string[]): string {
  const parts = [base, ...(locale ? [locale] : []), ...extra];
  return parts.join(":");
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

interface StrapiSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: StrapiMedia | null;
}

export interface SeoOverride {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

function mapSeo(seo: StrapiSeo | null | undefined): SeoOverride | null {
  if (!seo) return null;
  return {
    metaTitle: seo.metaTitle || "",
    metaDescription: seo.metaDescription || "",
    ogImage: seo.ogImage?.url ? strapiImageUrl(seo.ogImage.url) : "",
  };
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
  seo?: StrapiSeo | null;
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
  featured: boolean;
  order: number | null;
  contentBlocks: StrapiContentBlock[];
  seo?: StrapiSeo | null;
}

interface StrapiServiceGeneral {
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  icon: StrapiMedia | null;
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
  general: StrapiServiceGeneral | null;
  relatedProjects: StrapiProject[];
  order: number;
  definitionSection: StrapiSectionIntro | null;
  questionsSection: { intro: StrapiSectionIntro | null; cards: StrapiQuestionCard[] } | null;
  helpSection: {
    intro: StrapiSectionIntro | null;
    cards: StrapiHelpCard[];
  } | null;
  processSection: { intro: StrapiSectionIntro | null; steps: StrapiProcessStep[] } | null;
  deliverablesSection: {
    intro: StrapiSectionIntro | null;
    variant: "smallCards" | "largeCards";
    smallCards: StrapiDeliverableCard[];
    largeCards: StrapiDeliverableGroup[];
  } | null;
  ctaBanner: { heading: string | null; ctaText: string | null; ctaLink: string | null } | null;
  projectExamplesIntro: StrapiSectionIntro | null;
  faqSection: { intro: StrapiSectionIntro | null; items: StrapiFaqItem[] } | null;
  relatedServicesIntro: StrapiSectionIntro | null;
  relatedServices: { general: StrapiServiceGeneral | null }[];
  seo?: StrapiSeo | null;
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
  seo?: StrapiSeo | null;
}

export interface ContentBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
  alt?: string;
}

export interface Project {
  documentId?: string;
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
  imageAlt?: string;
  homepageImage?: string;
  homepageImageAlt?: string;
  featured?: boolean;
  order?: number | null;
  caseStudy: {
    heroSubtitle: string;
    client: string;
    year: string;
    duration: string;
    blocks: ContentBlock[];
  };
  seo?: SeoOverride | null;
}

export interface BlogPost {
  documentId?: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  imageAlt?: string;
  tags: string[];
  readingTime: string;
  featured?: boolean;
  order?: number | null;
  content: ContentBlock[];
  seo?: SeoOverride | null;
}

export interface TeamMember {
  name: string;
  title: string;
  image: string;
  imageAlt?: string;
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
  documentId?: string;
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  icon: string;
  relatedProjectSlugs: string[];
  definitionSection: SectionIntro | null;
  questionsSection: ServiceQuestionsSection | null;
  helpSection: ServiceHelpSection | null;
  processSection: ServiceProcessSection | null;
  deliverablesSection: ServiceDeliverablesSection | null;
  ctaBanner: { heading: string; ctaText: string; ctaLink: string } | null;
  projectExamplesIntro: SectionIntro | null;
  faqSection: ServiceFaqSection | null;
  relatedServicesIntro: SectionIntro | null;
  relatedServices: RelatedServiceSummary[];
  seo?: SeoOverride | null;
}

export interface Client {
  name: string;
  initials: string;
  logo?: string;
  logoAlt?: string;
  order: number;
  featured: boolean;
}

export interface WhyUsCard {
  image: string;
  imageAlt?: string;
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
  documentId?: string;
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  tags: string[];
  excerpt: string;
  content: ContentBlock[];
  seo?: SeoOverride | null;
}

const CAREER_LOCATION = "Budapest / Hybrid";
const CAREER_TYPE = "Teljes munkaidő";

function mapProject(p: StrapiProject): Project {
  return {
    documentId: p.documentId,
    slug: p.slug,
    title: p.title,
    tags: p.tags?.map((t) => t.name) || [],
    description: p.description || "",
    image: strapiImageUrl(p.image?.url),
    imageAlt: p.image?.alternativeText || "",
    homepageImage: p.homepageImage ? strapiImageUrl(p.homepageImage.url) : undefined,
    homepageImageAlt: p.homepageImage?.alternativeText || "",
    featured: p.featured,
    order: p.order ?? null,
    caseStudy: {
      heroSubtitle: p.caseStudy?.heroSubtitle || "",
      client: p.caseStudy?.client || "",
      year: p.caseStudy?.year || "",
      duration: p.caseStudy?.duration || "",
      blocks: mapContentBlocks(p.contentBlocks),
    },
    seo: mapSeo(p.seo),
  };
}

function mapBlogPost(p: StrapiBlogPost): BlogPost {
  return {
    documentId: p.documentId,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || "",
    date: p.date || "",
    author: p.author?.name || "",
    image: strapiImageUrl(p.image?.url),
    imageAlt: p.image?.alternativeText || "",
    tags: p.tags?.map((t) => t.name) || [],
    readingTime: p.readingTime || "",
    featured: p.featured ?? false,
    order: p.order ?? null,
    content: mapContentBlocks(p.contentBlocks),
    seo: mapSeo(p.seo),
  };
}

const PROJECT_POPULATE =
  "populate[0]=image&populate[1]=homepageImage&populate[2]=tags&populate[3]=caseStudy&populate[4]=contentBlocks.image&populate[5]=seo.ogImage";

export async function getProjects(locale?: string): Promise<Project[]> {
  const res = await fetchApi<StrapiListResponse<StrapiProject>>(
    appendLocale(
      `/projects?${PROJECT_POPULATE}&pagination[pageSize]=100&sort[0]=order:asc&sort[1]=createdAt:asc`,
      locale
    )
  );
  return res.data.map(mapProject);
}

export async function getProjectBySlug(slug: string, locale?: string): Promise<Project | null> {
  const res = await fetchApi<StrapiListResponse<StrapiProject>>(
    appendLocale(
      `/projects?${PROJECT_POPULATE}&filters[slug][$eq]=${encodeURIComponent(slug)}`,
      locale
    )
  );
  return res.data[0] ? mapProject(res.data[0]) : null;
}

export function getNextProject(projects: Project[], currentSlug: string): Project {
  const idx = projects.findIndex((p) => p.slug === currentSlug);
  return projects[(idx + 1) % projects.length];
}

const BLOG_POPULATE =
  "populate[0]=image&populate[1]=tags&populate[2]=contentBlocks.image&populate[3]=author&populate[4]=seo.ogImage";

export async function getBlogPosts(locale?: string): Promise<BlogPost[]> {
  const res = await fetchApi<StrapiListResponse<StrapiBlogPost>>(
    appendLocale(
      `/blog-posts?${BLOG_POPULATE}&pagination[pageSize]=100&sort=date:desc`,
      locale
    )
  );
  return res.data.map(mapBlogPost);
}

export async function getBlogPostBySlug(slug: string, locale?: string): Promise<BlogPost | null> {
  const res = await fetchApi<StrapiListResponse<StrapiBlogPost>>(
    appendLocale(
      `/blog-posts?${BLOG_POPULATE}&filters[slug][$eq]=${encodeURIComponent(slug)}`,
      locale
    )
  );
  return res.data[0] ? mapBlogPost(res.data[0]) : null;
}

export function getNextBlogPost(posts: BlogPost[], currentSlug: string): BlogPost {
  const idx = posts.findIndex((p) => p.slug === currentSlug);
  return posts[(idx + 1) % posts.length];
}

export async function getTeamMembers(locale?: string): Promise<TeamMember[]> {
  const res = await fetchApi<StrapiListResponse<StrapiTeamMember>>(
    appendLocale(
      "/team-members?populate[0]=image&pagination[pageSize]=100&sort=order:asc",
      locale
    )
  );
  return res.data.map((m) => ({
    name: m.name,
    title: m.title,
    image: strapiImageUrl(m.image?.url),
    imageAlt: m.image?.alternativeText || "",
  }));
}

export async function getGalleryImages(locale?: string): Promise<GalleryImage[]> {
  const res = await fetchApi<StrapiSingleResponse<{ galleryImages: StrapiMedia[] }>>(
    appendLocale("/about-page?populate[0]=galleryImages", locale)
  );
  return (res.data?.galleryImages || []).map((img) => ({
    src: strapiImageUrl(img.url),
    alt: img.alternativeText || "",
  }));
}

const SERVICE_POPULATE =
  "populate[0]=general&populate[1]=general.icon&populate[2]=relatedProjects&populate[3]=seo.ogImage" +
  "&populate[4]=questionsSection.intro&populate[5]=questionsSection.cards" +
  "&populate[6]=helpSection.intro&populate[7]=helpSection.cards.icon" +
  "&populate[8]=processSection.intro&populate[9]=processSection.steps" +
  "&populate[10]=deliverablesSection.intro&populate[11]=deliverablesSection.smallCards.icon&populate[12]=deliverablesSection.largeCards.icon&populate[13]=deliverablesSection.largeCards.bullets" +
  "&populate[14]=projectExamplesIntro&populate[15]=faqSection.intro&populate[16]=faqSection.items" +
  "&populate[17]=relatedServicesIntro&populate[18]=relatedServices.general.icon&populate[19]=ctaBanner&populate[20]=definitionSection";

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
    documentId: s.documentId,
    slug: s.general?.slug || "",
    title: s.general?.title || "",
    subtitle: s.general?.subtitle || "",
    heroDescription: s.general?.heroDescription || "",
    icon: strapiImageUrl(s.general?.icon?.url),
    relatedProjectSlugs: (s.relatedProjects || []).map((p) => p.slug),
    definitionSection: mapSectionIntro(s.definitionSection),
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
    ctaBanner: s.ctaBanner
      ? {
          heading: s.ctaBanner.heading || "",
          ctaText: s.ctaBanner.ctaText || "",
          ctaLink: s.ctaBanner.ctaLink || "",
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
    seo: mapSeo(s.seo),
  };
}

export async function getServices(locale?: string): Promise<Service[]> {
  const res = await fetchApi<StrapiListResponse<StrapiService>>(
    appendLocale(
      `/services?${SERVICE_POPULATE}&pagination[pageSize]=100&sort=order:asc`,
      locale
    )
  );
  return res.data.map(mapService);
}

export async function getServiceBySlug(slug: string, locale?: string): Promise<Service | null> {
  const res = await fetchApi<StrapiListResponse<StrapiService>>(
    appendLocale(
      `/services?${SERVICE_POPULATE}&filters[general][slug][$eq]=${encodeURIComponent(slug)}`,
      locale
    )
  );
  return res.data[0] ? mapService(res.data[0]) : null;
}

export async function getClients(locale?: string): Promise<Client[]> {
  const res = await fetchApi<StrapiListResponse<StrapiClient>>(
    appendLocale(
      "/clients?populate[0]=logo&pagination[pageSize]=100&sort=order:asc",
      locale
    )
  );
  return res.data.map((c) => ({
    name: c.name,
    initials: c.initials || "",
    logo: c.logo ? strapiImageUrl(c.logo.url) : undefined,
    logoAlt: c.logo?.alternativeText || "",
    order: c.order,
    featured: c.featured,
  }));
}


const CAREER_POPULATE = "populate[0]=tags&populate[1]=contentBlocks&populate[2]=contentBlocks.image&populate[3]=seo.ogImage";

export async function getCareerPositions(locale?: string): Promise<CareerPosition[]> {
  const res = await fetchApi<StrapiListResponse<StrapiCareerPosition>>(
    appendLocale(
      `/career-positions?${CAREER_POPULATE}&pagination[pageSize]=100&filters[isActive][$eq]=true`,
      locale
    )
  );
  return res.data.map((c) => ({
    documentId: c.documentId,
    slug: c.slug,
    title: c.title,
    team: c.team || "",
    location: CAREER_LOCATION,
    type: CAREER_TYPE,
    tags: c.tags?.map((t) => t.name) || [],
    excerpt: c.excerpt || "",
    content: mapContentBlocks(c.contentBlocks),
    seo: mapSeo(c.seo),
  }));
}

export async function getCareerPositionBySlug(slug: string, locale?: string): Promise<CareerPosition | null> {
  const res = await fetchApi<StrapiListResponse<StrapiCareerPosition>>(
    appendLocale(
      `/career-positions?${CAREER_POPULATE}&filters[slug][$eq]=${encodeURIComponent(slug)}`,
      locale
    )
  );
  return res.data[0]
    ? {
        documentId: res.data[0].documentId,
        slug: res.data[0].slug,
        title: res.data[0].title,
        team: res.data[0].team || "",
        location: CAREER_LOCATION,
        type: CAREER_TYPE,
        tags: res.data[0].tags?.map((t) => t.name) || [],
        excerpt: res.data[0].excerpt || "",
        content: mapContentBlocks(res.data[0].contentBlocks),
        seo: mapSeo(res.data[0].seo),
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
  seo?: SeoOverride | null;
}

export async function getHomepage(locale?: string): Promise<HomepageData> {
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
    seo?: StrapiSeo | null;
  }>>(appendLocale("/homepage?populate[0]=hero&populate[1]=servicesSection&populate[2]=projectsSection&populate[3]=blogSection&populate[4]=hero.backgroundImage&populate[5]=ctaBanner&populate[6]=seo.ogImage", locale));
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
    seo: mapSeo(d.seo),
  };
}

export interface ContactPageData {
  hero: { heading: string; description: string; backgroundImage: string };
  formHeading: string;
  successTitle: string;
  successMessage: string;
  mapHeading: string;
  mapEmbedUrl: string;
  formSubjects: { label: string; value: string; isCareer?: boolean }[];
  careerConsent: { checkbox1Text: string; checkbox2Text: string } | null;
  backgroundImage: string;
  seo?: SeoOverride | null;
}

export async function getContactPage(locale?: string): Promise<ContactPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: { heading: string; description: string; backgroundImage: StrapiMedia | null };
    formHeading: string;
    successTitle: string;
    successMessage: string;
    mapHeading: string;
    mapEmbedUrl: string;
    formSubjects: { id: number; label: string; value: string; isCareer?: boolean }[];
    careerConsent: { checkbox1Text: string | null; checkbox2Text: string | null } | null;
    backgroundImage: StrapiMedia | null;
    seo?: StrapiSeo | null;
  }>>(appendLocale("/contact-page?populate[0]=hero&populate[1]=formSubjects&populate[2]=hero.backgroundImage&populate[3]=backgroundImage&populate[4]=seo.ogImage&populate[5]=careerConsent", locale));
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
    formSubjects: (d.formSubjects || []).map((s) => ({ label: s.label, value: s.value, isCareer: !!s.isCareer })),
    careerConsent: d.careerConsent
      ? {
          checkbox1Text: d.careerConsent.checkbox1Text || "",
          checkbox2Text: d.careerConsent.checkbox2Text || "",
        }
      : null,
    backgroundImage: strapiImageUrl(d.backgroundImage?.url),
    seo: mapSeo(d.seo),
  };
}

export interface GlobalSettings {
  siteName: string;
  englishSiteEnabled: boolean;
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

export async function getGlobalSettings(locale?: string): Promise<GlobalSettings> {
  const res = await fetchApi<StrapiSingleResponse<{
    siteName: string;
    englishSiteEnabled?: boolean;
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
  }>>(appendLocale("/global-setting?populate[0]=socialLinks&populate[1]=openingHours&populate[2]=heroBackgroundPattern&populate[3]=logo&populate[4]=bgGraphic1&populate[5]=bgGraphic2&populate[6]=favicon&populate[7]=ogImage", locale));
  const d = res.data;
  return {
    siteName: d.siteName || "",
    englishSiteEnabled: d.englishSiteEnabled === true,
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
  seo?: SeoOverride | null;
}

export async function getAboutPage(locale?: string): Promise<AboutPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: { heading: string; description: string; backgroundImage: StrapiMedia | null };
    intro: { heading: string; body: string } | null;
    seo?: StrapiSeo | null;
  }>>(appendLocale("/about-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=intro&populate[3]=seo.ogImage", locale));
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
    seo: mapSeo(d.seo),
  };
}

// CV-feltöltés a kapcsolat űrlapról. A statikus (éles) buildben a Strapi másik
// domainen fut, ezért az origin build-időben konfigurálható.
const STRAPI_PUBLIC_ORIGIN = (import.meta.env.VITE_STRAPI_PUBLIC_URL || "").replace(/\/+$/, "");

export const CV_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const CV_ACCEPT = ".pdf,.doc,.docx";
export const CV_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

export async function uploadCv(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  // Alapértelmezés: azonos origin, a /strapi proxy-útvonalon keresztül.
  // Ha VITE_STRAPI_PUBLIC_URL be van állítva (közvetlen Strapi origin),
  // ott az API előtag nélkül, /api alatt érhető el.
  const endpoint = STRAPI_PUBLIC_ORIGIN
    ? `${STRAPI_PUBLIC_ORIGIN}/api/cv-upload`
    : `${window.location.origin}${STRAPI_API}/cv-upload`;
  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    // Transport/backend messages are not visitor copy and may be in a
    // different locale. The caller maps this stable code to localized UI text.
    throw new Error("CV_UPLOAD_FAILED");
  }
}

export interface LegalDocuments {
  privacyPdfUrl: string;
  cookiePdfUrl: string;
  imprintPdfUrl: string;
}

export const DEFAULT_COOKIE_PDF_URL =
  `${import.meta.env.BASE_URL}legal/sutikezelesi-tajekoztato.pdf`;

export async function getLegalDocuments(locale?: string): Promise<LegalDocuments> {
  const res = await fetchApi<StrapiSingleResponse<{
    privacyPdf: StrapiMedia | null;
    cookiePdf: StrapiMedia | null;
    imprintPdf: StrapiMedia | null;
  }>>(appendLocale("/legal-document?populate=*", locale));
  const d = res.data;
  return {
    privacyPdfUrl: d.privacyPdf?.url ? strapiImageUrl(d.privacyPdf.url) : "",
    cookiePdfUrl: d.cookiePdf?.url
      ? strapiImageUrl(d.cookiePdf.url)
      : DEFAULT_COOKIE_PDF_URL,
    imprintPdfUrl: d.imprintPdf?.url ? strapiImageUrl(d.imprintPdf.url) : "",
  };
}

export interface CareerPageData {
  hero: { heading: string; description: string; backgroundImage: string };
  workWithUs: CareerWorkWithUs;
  whyUs: CareerWhyUsSection;
  seo?: SeoOverride | null;
}

export interface ProjectsPageData {
  heading: string;
  description: string;
  seo?: SeoOverride | null;
}

export interface BlogPageData {
  heading: string;
  description: string;
  seo?: SeoOverride | null;
}

export async function getProjectsPage(locale?: string): Promise<ProjectsPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    heading: string;
    description: string;
    seo?: StrapiSeo | null;
  }>>(appendLocale("/projects-page?populate[0]=seo.ogImage", locale));
  const d = res.data;
  return {
    heading: d.heading || "",
    description: d.description || "",
    seo: mapSeo(d.seo),
  };
}

export async function getBlogPage(locale?: string): Promise<BlogPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    heading: string;
    description: string;
    seo?: StrapiSeo | null;
  }>>(appendLocale("/blog-page?populate[0]=seo.ogImage", locale));
  const d = res.data;
  return {
    heading: d.heading || "",
    description: d.description || "",
    seo: mapSeo(d.seo),
  };
}

export async function getCareerPage(locale?: string): Promise<CareerPageData> {
  const res = await fetchApi<StrapiSingleResponse<{
    hero: { heading: string; description: string; backgroundImage: StrapiMedia | null };
    workWithUs: { heading: string; description: string } | null;
    whyUs: {
      sectionHeading: string;
      items: { title: string; description: string; image: StrapiMedia | null }[];
    } | null;
    seo?: StrapiSeo | null;
  }>>(appendLocale("/career-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=workWithUs&populate[3]=whyUs&populate[4]=whyUs.items&populate[5]=whyUs.items.image&populate[6]=seo.ogImage", locale));
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
        imageAlt: item.image?.alternativeText || "",
      })),
    },
    seo: mapSeo(d.seo),
  };
}

export async function getAllProjectTags(locale?: string): Promise<string[]> {
  const projects = await getProjects(locale);
  const tags = new Set<string>();
  projects.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags);
}

export async function getAllBlogTags(locale?: string): Promise<string[]> {
  const posts = await getBlogPosts(locale);
  const tags = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => tags.add(t)));
  return Array.from(tags);
}
