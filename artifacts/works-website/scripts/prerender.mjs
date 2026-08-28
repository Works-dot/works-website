import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.resolve(root, "dist/public");

async function prerender() {
  const {
    render,
    getLocaleFallback,
    getPageMeta,
    buildMetaTags,
    SITE_URL,
    PUBLIC_LOCALES,
    getStaticPathsForLocale,
    getLocaleFromPath,
  } = await import(path.resolve(root, "dist/server/entry-server.js"));

  const template = fs.readFileSync(path.resolve(outDir, "index.html"), "utf-8");

  // Build every public locale from its own embedded dataset.
  const allRoutes = [];

  for (const locale of PUBLIC_LOCALES) {
    const staticRoutes = getStaticPathsForLocale(locale);

    const projects = getLocaleFallback("projects", locale) || [];
    const blogPosts = getLocaleFallback("blogPosts", locale) || [];
    const services = getLocaleFallback("services", locale) || [];
    const positions = getLocaleFallback("careerPositions", locale) || [];
    if (locale === "hu" && (projects.length === 0 || blogPosts.length === 0 || services.length === 0)) {
      throw new Error(
        "Prerender safety check failed: HU projects, blog posts, or services list is empty."
      );
    }
    const dynamicRoutes = [
      ...projects.map((p) => locale === "hu" ? `/projektek/${p.slug}` : `/en/projects/${p.slug}`),
      ...blogPosts.map((p) => locale === "hu" ? `/blog/${p.slug}` : `/en/blog/${p.slug}`),
      ...services.map((s) => locale === "hu" ? `/szolgaltatasok/${s.slug}` : `/en/services/${s.slug}`),
      ...positions.map((p) => locale === "hu" ? `/karrier/${p.slug}` : `/en/careers/${p.slug}`),
    ];

    allRoutes.push(...staticRoutes, ...dynamicRoutes);
  }

  let generated = 0;

  for (const route of allRoutes) {
    const locale = getLocaleFromPath(route);
    const { html } = render(route);
    const meta = getPageMeta(route, locale);
    const headTags = buildMetaTags(meta);

    let page = template;

    page = page.replace(
      /<title>.*?<\/title>/,
      ""
    );

    page = page.replace("<!--ssr-head-->", headTags);
    page = page.replace("<!--ssr-outlet-->", html);
    page = page.replace(/<html(\s[^>]*)?\slang=(["'])[^"']*\2([^>]*)>/i, `<html$1 lang="${locale}"$3>`);

    const filePath =
      route === "/"
        ? path.resolve(outDir, "index.html")
        : path.resolve(outDir, route.slice(1), "index.html");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, page);
    generated++;
    console.log(`  ✓ ${route}`);
  }

  // Külön 404-es oldal: a szerver ezt adja vissza 404-es státusszal
  // az ismeretlen címekre a főoldal (soft-404) helyett.
  {
    const { html } = render("/__not_found__");
    let page = template;
    page = page.replace(/<title>.*?<\/title>/, "");
    page = page.replace(
      "<!--ssr-head-->",
      [
        "<title>Az oldal nem található | Works.</title>",
        '<meta name="description" content="A keresett oldal nem található. Nézz körül a Works. főoldalán, projektjeink vagy blogunk között.">',
        '<meta name="robots" content="noindex">',
      ].join("\n")
    );
    page = page.replace("<!--ssr-outlet-->", html);
    fs.writeFileSync(path.resolve(outDir, "404.html"), page);
    console.log("  ✓ /404.html");
  }

  // sitemap.xml — minden prerenderelt oldal; blogcikkeknél lastmod a publikálás dátuma.
  {
    const escapeXml = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const lastmodByRoute = new Map();
    for (const locale of PUBLIC_LOCALES) {
      const blogPosts = getLocaleFallback("blogPosts", locale) || [];
      for (const post of blogPosts) {
        lastmodByRoute.set(
          locale === "hu" ? `/blog/${post.slug}` : `/en/blog/${post.slug}`,
          post.date
        );
      }
    }
    const urls = allRoutes
      .map((route) => {
        const loc = route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`;
        const lastmod = lastmodByRoute.get(route);
        return [
          "  <url>",
          `    <loc>${escapeXml(loc)}</loc>`,
          ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
          "  </url>",
        ].join("\n");
      })
      .join("\n");
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
    fs.writeFileSync(path.resolve(outDir, "sitemap.xml"), sitemap);
    console.log("  ✓ /sitemap.xml");
  }

  // robots.txt — mindent enged, sitemap-hivatkozással.
  {
    const robots = `User-agent: *\nAllow: /\nDisallow: /strapi/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
    fs.writeFileSync(path.resolve(outDir, "robots.txt"), robots);
    console.log("  ✓ /robots.txt");
  }

  console.log(`\nPre-rendered ${generated + 1} pages successfully.`);
}

prerender().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
