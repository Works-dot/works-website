// NOTE: Railway only redeploys this service when files under
// artifacts/works-website change — content-only Strapi commits do not
// trigger a website build (the Strapi-side auto-rebuild handles those).
// A bilingual build requires the localized Strapi schema to be live first.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mapContentBlocks, strapiImageUrl } from "../src/lib/content-blocks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.resolve(root, "src/data/strapi-cache.json");
const translationPath = path.resolve(root, "../strapi/translation/legacy-blog-hu.json");

// Fingerprints of the original English titles and non-image body blocks from
// the nine reviewed source documents. Independent of the checked-in website
// cache and the translation text: subsequent Hungarian editorial changes and
// deliberate unpublishing/deletion must remain possible.
const originalEnglish = {
  nh6ut44kpi0lqaggf5tirux1: { title: "7756710fce455ccf6311e1bc903eb6f9cd57e6c8b9349aa7b208a3eff91519cf", body: "1e70a9c1d159794fb8cdcd55c7447415a894c922d42b76b89c8a3fba0091f6bc" },
  ujw1s67r9rio7l9vcc9s2vrx: { title: "124b60e3ede7c67fad69592bae68d921c736c1b0dba3596854374337530f9b4c", body: "db875c825869290adb7f670582dca64f5057e6e0a865868dae20f811176e17ca" },
  ajkhd25h7aplaip5v1z4v4gs: { title: "01337de1672e019a25344986f0c73da573d02a50a792a82510288c16eac4d829", body: "7fc14bd1bd7d78e1f7aeb2c04cf2533bd8318fdab39204277c71315abbd432e3" },
  cjz20nuq4d3qug249hmlex0r: { title: "c7cb88b488ad780644b7bc1c3abbb91ccc82c4a4780934438a22c0e27a19f3eb", body: "b1a2f1b3499bcc026b3affc2642bdd1a3c997541434fafa9c9bad13a2e7b247b" },
  vfttft8q8d6l1g2six84e23w: { title: "ae5bb7956549887ef2286d589fbc89aa0fe1f406c43b8e178b16c5a77e46db56", body: "a1c1fb33726b8f86f668309ffa73b4c8b600c31093fec87e26a55a7a5b007ce0" },
  o3lvxuv4pul8az9yhc5tujeg: { title: "0a7eef119b138d8527cec3c0e2fcc1c9a773cf7e3eacf72be80260fef27172f3", body: "5697928c2d9db87597b57b17614d860dc206e7adbf77b9269e0fc44ba81b05f7" },
  e110e4p6k0c4ml9a1wtm56bw: { title: "9e62cb79ea4eabf0e08ece822c953879829bb1bf584ba1e0d5f3672e2debf65d", body: "a9c0466806a2928beb6125278effcef7e721271e82d13ca3e19ff341b46161e2" },
  yg84ksnrfvfppqxzyscf8x74: { title: "3e8ccd5d870034ea78e038c3c7b40fa8bf77354beb22485b9bd3e5bfab419f65", body: "42cb7ade1661f3ea908c72b3cc258ba04bb0a3549ead780e5db0fef197573b7b" },
  qya03sr2vay1guwkurkueza6: { title: "d22eb3ac010ed1a9f3dfb2d335263328bcc61be179eb6958b3418f3d4f01477c", body: "c0cff78152a40431156cd2e64de4f8c9676c4bff0821cc37458b4e7787a7c79e" },
};

const fingerprint = (text) => createHash("sha256").update(text).digest("hex");
const bodyFingerprint = (post) => post?.content && fingerprint(JSON.stringify(
  post.content.filter((block) => block.type === "text" || block.type === "highlight")
    .map((block) => [block.type, block.content]),
));

// Check *fresh published* HU and EN API results; never decide against the
// checked-in cache. This is a permanent no-regression check, not an exact
// translation sync gate or a prohibition on editorial unpublishing.
export function verifyLegacyHuTranslation(data, translation) {
  if (translation?.version !== 1 || !Array.isArray(translation.records) ||
      translation.records.length !== 9 ||
      new Set(translation.records.map((record) => record.documentId)).size !== 9 ||
      translation.records.some((record) => !originalEnglish[record.documentId])) {
    throw new Error("Invalid nine-post HU translation package");
  }
  if (!Array.isArray(data?.hu?.blogPosts) || !Array.isArray(data?.en?.blogPosts)) {
    throw new Error("Published HU/EN blog lists missing from fresh Strapi response");
  }
  for (const record of translation.records) {
    const matches = data.hu.blogPosts.filter((post) => post.documentId === record.documentId);
    if (matches.length > 1) throw new Error(`Duplicate published HU document: ${record.documentId}`);
    if (!matches.length) continue; // Deliberately unpublished or removed by an editor.
    const post = matches[0];
    const en = data.en.blogPosts.find((item) => item.documentId === record.documentId);
    const source = originalEnglish[record.documentId];
    const huBody = bodyFingerprint(post);
    if ((post.title && (fingerprint(post.title) === source.title || post.title === en?.title)) ||
        (huBody && (huBody === source.body || huBody === bodyFingerprint(en)))) {
      throw new Error(`Published HU post still contains original English title/body: ${record.slug} (${record.documentId}); deploy/verify CMS first`);
    }
  }
}

const STRAPI_BASE = process.env.STRAPI_URL || "http://localhost:8099";
const STRAPI_API = `${STRAPI_BASE}/strapi/api`;

let activeLocale = "hu";

async function fetchApi(endpoint) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${STRAPI_API}${endpoint}${separator}locale=${encodeURIComponent(activeLocale)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} — ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// In strict (production) mode only a genuine 404 (content simply not created)
// may be swallowed for optional endpoints; any other error (network, 400 from
// an old-schema Strapi, 5xx) must propagate so the build retries/fails instead
// of silently shipping pages with erased CMS content.
function allowOptionalSkip(err) {
  if (!STRICT) return true;
  return err?.status === 404;
}

function mapSeo(seo) {
  if (!seo) return null;
  return {
    metaTitle: seo.metaTitle || "",
    metaDescription: seo.metaDescription || "",
    ogImage: seo.ogImage?.url ? strapiImageUrl(seo.ogImage.url) : "",
  };
}

function mapProject(p) {
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

function mapBlogPost(p) {
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

function mapSectionIntro(i) {
  if (!i) return null;
  return {
    kicker: i.kicker || "",
    heading: i.heading || "",
    description: i.description || "",
  };
}

function mapService(s) {
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

async function fetchAll(locale) {
  activeLocale = locale;
  const cache = {};

  const PROJECT_POPULATE =
    "populate[0]=image&populate[1]=homepageImage&populate[2]=tags&populate[3]=caseStudy&populate[4]=contentBlocks.image&populate[5]=seo.ogImage";
  const projectsRes = await fetchApi(
    `/projects?${PROJECT_POPULATE}&pagination[pageSize]=100&sort=createdAt:asc`
  );
  cache.projects = projectsRes.data.map(mapProject);
  console.log(`  ✓ ${cache.projects.length} project(s)`);

  const BLOG_POPULATE =
    "populate[0]=image&populate[1]=tags&populate[2]=contentBlocks.image&populate[3]=author&populate[4]=seo.ogImage";
  const blogRes = await fetchApi(
    `/blog-posts?${BLOG_POPULATE}&pagination[pageSize]=100&sort=date:desc`
  );
  cache.blogPosts = blogRes.data.map(mapBlogPost);
  console.log(`  ✓ ${cache.blogPosts.length} blog post(s)`);

  const SERVICE_POPULATE =
    "populate[0]=general&populate[1]=general.icon&populate[2]=relatedProjects&populate[3]=seo.ogImage" +
    "&populate[4]=questionsSection.intro&populate[5]=questionsSection.cards" +
    "&populate[6]=helpSection.intro&populate[7]=helpSection.cards.icon" +
    "&populate[8]=processSection.intro&populate[9]=processSection.steps" +
    "&populate[10]=deliverablesSection.intro&populate[11]=deliverablesSection.smallCards.icon&populate[12]=deliverablesSection.largeCards.icon&populate[13]=deliverablesSection.largeCards.bullets" +
    "&populate[14]=projectExamplesIntro&populate[15]=faqSection.intro&populate[16]=faqSection.items" +
    "&populate[17]=relatedServicesIntro&populate[18]=relatedServices.general.icon&populate[19]=ctaBanner&populate[20]=definitionSection";
  const servicesRes = await fetchApi(
    `/services?${SERVICE_POPULATE}&pagination[pageSize]=100&sort=order:asc`
  );
  cache.services = servicesRes.data.map(mapService);
  console.log(`  ✓ ${cache.services.length} service(s)`);

  const teamRes = await fetchApi(
    "/team-members?populate[0]=image&pagination[pageSize]=100&sort=order:asc"
  );
  cache.teamMembers = teamRes.data.map((m) => ({
    name: m.name,
    title: m.title,
    image: strapiImageUrl(m.image?.url),
    imageAlt: m.image?.alternativeText || "",
  }));
  console.log(`  ✓ ${cache.teamMembers.length} team member(s)`);

  const clientsRes = await fetchApi(
    "/clients?populate[0]=logo&pagination[pageSize]=100&sort=order:asc"
  );
  cache.clients = clientsRes.data.map((c) => ({
    name: c.name,
    initials: c.initials || "",
    logo: c.logo ? strapiImageUrl(c.logo.url) : undefined,
    logoAlt: c.logo?.alternativeText || "",
    order: c.order,
    featured: c.featured,
  }));
  console.log(`  ✓ ${cache.clients.length} client(s)`);

  const CAREER_POPULATE = "populate[0]=tags&populate[1]=contentBlocks&populate[2]=contentBlocks.image&populate[3]=seo.ogImage";
  const careersRes = await fetchApi(
    `/career-positions?${CAREER_POPULATE}&pagination[pageSize]=100&filters[isActive][$eq]=true&status=published`
  );
  cache.positions = careersRes.data.filter((c) => c.isActive === true && !!c.publishedAt).map((c) => ({
    documentId: c.documentId,
    publishedAt: c.publishedAt,
    slug: c.slug,
    title: c.title,
    team: c.team || "",
    location: c.location || "",
    type: c.type || "",
    tags: c.tags?.map((t) => t.name) || [],
    excerpt: c.excerpt || "",
    content: mapContentBlocks(c.contentBlocks),
    seo: mapSeo(c.seo),
  }));
  console.log(`  ✓ ${cache.positions.length} career position(s)`);

  try {
    const galleryRes = await fetchApi("/about-page?populate[0]=galleryImages");
    cache.galleryImages = (galleryRes.data?.galleryImages || []).map((img) => ({
      src: strapiImageUrl(img.url),
      alt: img.alternativeText || "",
    }));
    console.log(`  ✓ ${cache.galleryImages.length} gallery image(s)`);
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.galleryImages = null;
    console.log("  ⚠ gallery images skipped (about-page not found)");
  }

  try {
    const globalRes = await fetchApi(
      "/global-setting?populate[0]=socialLinks&populate[1]=openingHours&populate[2]=heroBackgroundPattern&populate[3]=logo&populate[4]=bgGraphic1&populate[5]=bgGraphic2&populate[6]=favicon&populate[7]=ogImage"
    );
    const gd = globalRes.data;
    cache.globalSettings = {
      siteName: gd.siteName || "",
      contactEmail: gd.contactEmail || "",
      contactPhone: gd.contactPhone || "",
      address: gd.address || "",
      footerTagline: gd.footerTagline || "",
      copyrightText: gd.copyrightText || "",
      newsletterHeading: gd.newsletterHeading || "",
      newsletterDescription: gd.newsletterDescription || "",
      heroBackgroundPatternUrl: gd.heroBackgroundPattern?.url
        ? strapiImageUrl(gd.heroBackgroundPattern.url)
        : "",
      logoUrl: gd.logo?.url ? strapiImageUrl(gd.logo.url) : "",
      bgGraphic1Url: gd.bgGraphic1?.url ? strapiImageUrl(gd.bgGraphic1.url) : "",
      bgGraphic2Url: gd.bgGraphic2?.url ? strapiImageUrl(gd.bgGraphic2.url) : "",
      faviconUrl: gd.favicon?.url ? strapiImageUrl(gd.favicon.url) : "",
      ogImageUrl: gd.ogImage?.url ? strapiImageUrl(gd.ogImage.url) : "",
      openingHours: (gd.openingHours || []).map((o) => ({ day: o.day, hours: o.hours })),
      socialLinks: (gd.socialLinks || []).map((s) => ({ platform: s.platform, url: s.url })),
    };
    console.log("  ✓ global settings");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.globalSettings = null;
    console.log("  ⚠ global settings skipped (not found)");
  }

  try {
    const contactRes = await fetchApi("/contact-page?populate[0]=hero&populate[1]=formSubjects&populate[2]=hero.backgroundImage&populate[3]=backgroundImage&populate[4]=seo.ogImage&populate[5]=careerConsent");
    const cd = contactRes.data;
    cache.contactPage = {
      hero: {
        heading: cd.hero?.heading || "",
        description: cd.hero?.description || "",
        backgroundImage: strapiImageUrl(cd.hero?.backgroundImage?.url),
      },
      formHeading: cd.formHeading || "",
      successTitle: cd.successTitle || "",
      successMessage: cd.successMessage || "",
      mapHeading: cd.mapHeading || "",
      mapEmbedUrl: cd.mapEmbedUrl || "",
      formSubjects: (cd.formSubjects || []).map((s) => ({ label: s.label, value: s.value, isCareer: !!s.isCareer })),
      careerConsent: cd.careerConsent
        ? {
            checkbox1Text: cd.careerConsent.checkbox1Text || "",
            checkbox2Text: cd.careerConsent.checkbox2Text || "",
          }
        : null,
      backgroundImage: strapiImageUrl(cd.backgroundImage?.url),
      seo: mapSeo(cd.seo),
    };
    console.log("  ✓ contact page");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.contactPage = null;
    console.log("  ⚠ contact page skipped (not found)");
  }

  try {
    const homepageRes = await fetchApi(
      "/homepage?populate[0]=hero&populate[1]=servicesSection&populate[2]=projectsSection&populate[3]=blogSection&populate[4]=hero.backgroundImage&populate[5]=ctaBanner&populate[6]=seo.ogImage"
    );
    const hd = homepageRes.data;
    const hh = hd.hero;
    cache.homepage = {
      hero: hh ? {
        heading: hh.heading || "",
        highlightedWord: hh.highlightedWord || "",
        description: hh.description || "",
        primaryCtaText: hh.primaryCtaText || "",
        primaryCtaLink: hh.primaryCtaLink || "",
        secondaryCtaText: hh.secondaryCtaText || "",
        secondaryCtaLink: hh.secondaryCtaLink || "",
        backgroundImage: strapiImageUrl(hh.backgroundImage?.url),
      } : null,
      servicesSection: hd.servicesSection || null,
      projectsSection: hd.projectsSection || null,
      blogSection: hd.blogSection || null,
      ctaBanner: hd.ctaBanner
        ? {
            heading: hd.ctaBanner.heading || "",
            ctaText: hd.ctaBanner.ctaText || "",
            ctaLink: hd.ctaBanner.ctaLink || "",
          }
        : null,
      seo: mapSeo(hd.seo),
    };
    console.log("  ✓ homepage");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.homepage = null;
    console.log("  ⚠ homepage skipped (not found)");
  }

  try {
    const aboutRes = await fetchApi("/about-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=intro&populate[3]=seo.ogImage");
    cache.aboutPage = {
      hero: {
        heading: aboutRes.data?.hero?.heading || "",
        description: aboutRes.data?.hero?.description || "",
        backgroundImage: strapiImageUrl(aboutRes.data?.hero?.backgroundImage?.url),
      },
      intro: {
        heading: aboutRes.data?.intro?.heading || "",
        description: aboutRes.data?.intro?.body || "",
      },
      seo: mapSeo(aboutRes.data?.seo),
    };
    console.log("  ✓ about page");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.aboutPage = null;
    console.log("  ⚠ about page skipped (not found)");
  }

  try {
    const projectsPageRes = await fetchApi("/projects-page?populate[0]=seo.ogImage");
    const projectsPage = projectsPageRes.data;
    cache.projectsPage = {
      heading: projectsPage?.heading || "",
      description: projectsPage?.description || "",
      seo: mapSeo(projectsPage?.seo),
    };
    console.log("  ✓ projects page");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.projectsPage = null;
    console.log("  ⚠ projects page skipped (not found)");
  }

  try {
    const blogPageRes = await fetchApi("/blog-page?populate[0]=seo.ogImage");
    const blogPage = blogPageRes.data;
    cache.blogPage = {
      heading: blogPage?.heading || "",
      description: blogPage?.description || "",
      seo: mapSeo(blogPage?.seo),
    };
    console.log("  ✓ blog page");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.blogPage = null;
    console.log("  ⚠ blog page skipped (not found)");
  }

  try {
    const legalRes = await fetchApi("/legal-document?populate=*&status=published");
    const ld = legalRes.data;
    cache.legalDocuments = {
      privacyTitle: activeLocale === "hu" ? ld?.privacyTitle || "" : "",
      privacyBody: activeLocale === "hu" ? ld?.privacyBody || "" : "",
      cookieTitle: activeLocale === "hu" ? ld?.cookieTitle || "" : "",
      cookieBody: activeLocale === "hu" ? ld?.cookieBody || "" : "",
      imprintTitle: activeLocale === "hu" ? ld?.imprintTitle || "" : "",
      imprintBody: activeLocale === "hu" ? ld?.imprintBody || "" : "",
      privacyPdfUrl: ld?.privacyPdf?.url ? strapiImageUrl(ld.privacyPdf.url) : "",
      cookiePdfUrl: ld?.cookiePdf?.url ? strapiImageUrl(ld.cookiePdf.url) : "",
      imprintPdfUrl: ld?.imprintPdf?.url ? strapiImageUrl(ld.imprintPdf.url) : "",
    };
    console.log("  ✓ legal documents");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.legalDocuments = null;
    console.log("  ⚠ legal documents skipped (not found)");
  }

  try {
    const careerRes = await fetchApi("/career-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=workWithUs&populate[3]=whyUs&populate[4]=whyUs.items&populate[5]=whyUs.items.image&populate[6]=seo.ogImage");
    const cd2 = careerRes.data;
    cache.careerPage = {
      hero: {
        heading: cd2?.hero?.heading || "",
        description: cd2?.hero?.description || "",
        backgroundImage: strapiImageUrl(cd2?.hero?.backgroundImage?.url),
      },
      workWithUs: {
        heading: cd2?.workWithUs?.heading || "",
        description: cd2?.workWithUs?.description || "",
      },
      whyUs: {
        sectionHeading: cd2?.whyUs?.sectionHeading || "",
        items: (cd2?.whyUs?.items || []).map((item) => ({
          title: item.title,
          description: item.description ?? "",
          image: strapiImageUrl(item.image?.url),
          imageAlt: item.image?.alternativeText || "",
        })),
      },
      seo: mapSeo(cd2?.seo),
    };
    console.log("  ✓ career page");
  } catch (err) {
    if (!allowOptionalSkip(err)) throw err;
    cache.careerPage = null;
    console.log("  ⚠ career page skipped (not found)");
  }

  return cache;
}

// Strict mode: on production builds (Railway) the committed cache must NEVER be
// served as content — either the fetch succeeds or the build fails loudly.
// Railway injects RAILWAY_ENVIRONMENT_ID into every deployment; it can also be
// forced/disabled explicitly via STRAPI_FETCH_STRICT=1/0.
const STRICT =
  process.env.STRAPI_FETCH_STRICT === "1" ||
  (process.env.STRAPI_FETCH_STRICT !== "0" && !!process.env.RAILWAY_ENVIRONMENT_ID);

// In strict mode retry for a while: on Railway the website build can start
// before the freshly deployed Strapi (with the new schema) is up, and the old
// Strapi may reject queries that reference new fields.
const RETRY_ATTEMPTS = STRICT ? Number(process.env.STRAPI_FETCH_RETRIES || 10) : 1;
const RETRY_DELAY_MS = Number(process.env.STRAPI_FETCH_RETRY_DELAY_MS || 30000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAllWithRetry() {
  let lastErr;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) console.log(`\nRetry ${attempt}/${RETRY_ATTEMPTS}...`);
        const data = {
          hu: await fetchAll("hu"),
          en: await fetchAll("en"),
        };
        return data;
    } catch (err) {
      lastErr = err;
      console.warn(`  ✗ attempt ${attempt}/${RETRY_ATTEMPTS} failed: ${err.message}`);
      if (attempt < RETRY_ATTEMPTS) {
        console.warn(`  waiting ${Math.round(RETRY_DELAY_MS / 1000)}s before retrying (Strapi may still be deploying)...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }
  throw lastErr;
}

async function main() {
  console.log("Fetching content from Strapi...");
  console.log(`  API: ${STRAPI_API}`);
  console.log(`  Mode: ${STRICT ? "strict (production — fresh fetch required)" : "lenient (dev)"}`);

  try {
    const data = await fetchAllWithRetry();
    if (STRICT) {
      // Read only after a successful fresh fetch, so neither committed cache
      // nor an earlier retry can satisfy the guard.
      const translation = JSON.parse(fs.readFileSync(translationPath, "utf-8"));
      verifyLegacyHuTranslation(data, translation);
      console.log("  ✓ published legacy HU posts do not regress to original English");
    }
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`\nStrapi data cached to ${path.relative(root, outPath)}`);
  } catch (err) {
    console.warn(`\n⚠ Could not fetch Strapi data: ${err.message}`);
    if (STRICT) {
      console.error(
        "  STRICT mode: refusing to build with stale/committed cache — failing the build.\n" +
        "  (The committed cache may contain non-production content; a silent fallback would overwrite live content.)\n"
      );
      process.exit(1);
    }
    if (fs.existsSync(outPath)) {
      // Keep unrelated development content, but never retain an old job list
      // after a failed refresh. Production fails above without writing a cache.
      const previous = JSON.parse(fs.readFileSync(outPath, "utf-8"));
      if (previous.hu) {
        previous.hu.positions = [];
        if (previous.en) previous.en.positions = [];
      } else {
        previous.positions = [];
      }
      fs.writeFileSync(outPath, JSON.stringify(previous, null, 2), "utf-8");
      console.warn("  Keeping unrelated cached content; career positions cleared after refresh failure.\n");
    } else {
      console.warn("  No previous cache found — writing empty cache; build will use hardcoded fallback data.\n");
      fs.writeFileSync(outPath, JSON.stringify({}), "utf-8");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
