import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.resolve(root, "dist/public");

async function prerender() {
  const {
    render,
    projects,
    blogPosts,
    services,
    positions,
    getPageMeta,
    buildMetaTags,
  } = await import(path.resolve(root, "dist/server/entry-server.js"));

  const template = fs.readFileSync(path.resolve(outDir, "index.html"), "utf-8");

  const staticRoutes = [
    "/",
    "/projektek",
    "/blog",
    "/rolunk",
    "/kapcsolat",
    "/karrier",
  ];

  const dynamicRoutes = [
    ...projects.map((p) => `/projektek/${p.slug}`),
    ...blogPosts.map((p) => `/blog/${p.slug}`),
    ...services.map((s) => `/szolgaltatasok/${s.slug}`),
    ...positions.map((p) => `/karrier/${p.slug}`),
  ];

  const allRoutes = [...staticRoutes, ...dynamicRoutes];
  let generated = 0;

  for (const route of allRoutes) {
    const { html } = render(route);
    const meta = getPageMeta(route);
    const headTags = buildMetaTags(meta);

    let page = template;

    page = page.replace(
      /<title>.*?<\/title>/,
      ""
    );

    page = page.replace("<!--ssr-head-->", headTags);
    page = page.replace("<!--ssr-outlet-->", html);

    const filePath =
      route === "/"
        ? path.resolve(outDir, "index.html")
        : path.resolve(outDir, route.slice(1), "index.html");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, page);
    generated++;
    console.log(`  ✓ ${route}`);
  }

  console.log(`\nPre-rendered ${generated} pages successfully.`);
}

prerender().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
