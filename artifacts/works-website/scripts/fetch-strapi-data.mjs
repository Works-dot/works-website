import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.resolve(root, "src/data/strapi-cache.json");

const STRAPI_BASE = process.env.STRAPI_URL || "http://localhost:8099";
const STRAPI_API = `${STRAPI_BASE}/strapi/api`;

async function fetchApi(endpoint) {
  const url = `${STRAPI_API}${endpoint}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

function strapiImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `/strapi${url}`;
}

function mapContentBlocks(blocks) {
  if (!blocks) return [];
  return blocks.map((b) => {
    if (b.__component === "content.text-block") {
      return { type: "text", content: b.body || "" };
    }
    if (b.__component === "content.highlight-block") {
      return { type: "highlight", content: b.quote || "" };
    }
    if (b.__component === "content.image-block") {
      return {
        type: "image",
        content: strapiImageUrl(b.image?.url),
        caption: b.caption,
      };
    }
    return { type: "text", content: "" };
  });
}

function mapProject(p) {
  return {
    slug: p.slug,
    title: p.title,
    tags: p.tags?.map((t) => t.name) || [],
    description: p.description || "",
    image: strapiImageUrl(p.image?.url),
    homepageImage: p.homepageImage ? strapiImageUrl(p.homepageImage.url) : undefined,
    featured: p.featured,
    caseStudy: {
      heroSubtitle: p.caseStudy?.heroSubtitle || "",
      client: p.caseStudy?.client || "",
      year: p.caseStudy?.year || "",
      duration: p.caseStudy?.duration || "",
      blocks: mapContentBlocks(p.contentBlocks),
    },
  };
}

function mapBlogPost(p) {
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

function mapService(s) {
  return {
    slug: s.general?.slug || "",
    title: s.general?.title || "",
    subtitle: s.general?.subtitle || "",
    heroDescription: s.general?.heroDescription || "",
    valueQuestion: s.valueProposition?.question || "",
    valueAnswer: s.valueProposition?.answer || "",
    heroImage: strapiImageUrl(s.general?.heroImage?.url),
    icon: strapiImageUrl(s.general?.icon?.url),
    activities: (s.activities || []).map((a) => ({
      title: a.title,
      description: a.description,
      icon: strapiImageUrl(a.icon?.url),
    })),
    benefits: (s.benefits || []).map((b) => ({
      title: b.title,
      description: b.description,
      icon: strapiImageUrl(b.icon?.url),
    })),
    tools: (s.tools || []).map((t) => ({ name: t.name })),
    howWeWork: s.howWeWork || "",
    relatedProjectSlugs: (s.relatedProjects || []).map((p) => p.slug),
  };
}

async function fetchAll() {
  const cache = {};

  const PROJECT_POPULATE =
    "populate[0]=image&populate[1]=homepageImage&populate[2]=tags&populate[3]=caseStudy&populate[4]=contentBlocks.image";
  const projectsRes = await fetchApi(
    `/projects?${PROJECT_POPULATE}&pagination[pageSize]=100&sort=createdAt:asc`
  );
  cache.projects = projectsRes.data.map(mapProject);
  console.log(`  ✓ ${cache.projects.length} project(s)`);

  const BLOG_POPULATE =
    "populate[0]=image&populate[1]=tags&populate[2]=contentBlocks.image&populate[3]=author";
  const blogRes = await fetchApi(
    `/blog-posts?${BLOG_POPULATE}&pagination[pageSize]=100&sort=date:desc`
  );
  cache.blogPosts = blogRes.data.map(mapBlogPost);
  console.log(`  ✓ ${cache.blogPosts.length} blog post(s)`);

  const SERVICE_POPULATE =
    "populate[0]=general&populate[1]=general.icon&populate[2]=general.heroImage&populate[3]=valueProposition&populate[4]=activities&populate[5]=activities.icon&populate[6]=benefits&populate[7]=benefits.icon&populate[8]=tools&populate[9]=relatedProjects&populate[10]=seo";
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
  }));
  console.log(`  ✓ ${cache.teamMembers.length} team member(s)`);

  const clientsRes = await fetchApi(
    "/clients?populate[0]=logo&pagination[pageSize]=100&sort=order:asc"
  );
  cache.clients = clientsRes.data.map((c) => ({
    name: c.name,
    initials: c.initials || "",
    logo: c.logo ? strapiImageUrl(c.logo.url) : undefined,
    order: c.order,
    featured: c.featured,
  }));
  console.log(`  ✓ ${cache.clients.length} client(s)`);

  const CAREER_POPULATE = "populate[0]=tags&populate[1]=contentBlocks&populate[2]=contentBlocks.image";
  const careersRes = await fetchApi(
    `/career-positions?${CAREER_POPULATE}&pagination[pageSize]=100&filters[isActive][$eq]=true`
  );
  cache.positions = careersRes.data.map((c) => ({
    slug: c.slug,
    title: c.title,
    team: c.team || "",
    location: c.location || "",
    type: c.type || "",
    tags: c.tags?.map((t) => t.name) || [],
    excerpt: c.excerpt || "",
    content: mapContentBlocks(c.contentBlocks),
  }));
  console.log(`  ✓ ${cache.positions.length} career position(s)`);

  try {
    const galleryRes = await fetchApi("/about-page?populate[0]=galleryImages");
    cache.galleryImages = (galleryRes.data?.galleryImages || []).map((img) => ({
      src: strapiImageUrl(img.url),
      alt: img.alternativeText || "",
    }));
    console.log(`  ✓ ${cache.galleryImages.length} gallery image(s)`);
  } catch {
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
  } catch {
    cache.globalSettings = null;
    console.log("  ⚠ global settings skipped (not found)");
  }

  try {
    const contactRes = await fetchApi("/contact-page?populate[0]=hero&populate[1]=formSubjects&populate[2]=hero.backgroundImage&populate[3]=backgroundImage");
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
      formSubjects: (cd.formSubjects || []).map((s) => ({ label: s.label, value: s.value })),
      backgroundImage: strapiImageUrl(cd.backgroundImage?.url),
    };
    console.log("  ✓ contact page");
  } catch {
    cache.contactPage = null;
    console.log("  ⚠ contact page skipped (not found)");
  }

  try {
    const homepageRes = await fetchApi(
      "/homepage?populate[0]=hero&populate[1]=servicesSection&populate[2]=projectsSection&populate[3]=blogSection&populate[4]=hero.backgroundImage"
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
    };
    console.log("  ✓ homepage");
  } catch {
    cache.homepage = null;
    console.log("  ⚠ homepage skipped (not found)");
  }

  try {
    const aboutRes = await fetchApi("/about-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=intro");
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
    };
    console.log("  ✓ about page");
  } catch {
    cache.aboutPage = null;
    console.log("  ⚠ about page skipped (not found)");
  }

  try {
    const careerRes = await fetchApi("/career-page?populate[0]=hero&populate[1]=hero.backgroundImage&populate[2]=workWithUs&populate[3]=whyUs&populate[4]=whyUs.items&populate[5]=whyUs.items.image");
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
          description: item.description,
          image: strapiImageUrl(item.image?.url),
        })),
      },
    };
    console.log("  ✓ career page");
  } catch {
    cache.careerPage = null;
    console.log("  ⚠ career page skipped (not found)");
  }

  return cache;
}

async function main() {
  console.log("Fetching content from Strapi...");
  console.log(`  API: ${STRAPI_API}`);

  try {
    const data = await fetchAll();
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`\nStrapi data cached to ${path.relative(root, outPath)}`);
  } catch (err) {
    console.warn(`\n⚠ Could not fetch Strapi data: ${err.message}`);
    console.warn("  Cache reset to empty — build will use hardcoded fallback data.\n");
    fs.writeFileSync(outPath, JSON.stringify({}), "utf-8");
  }
}

main();
