import {
  setupWebsiteAutoRebuild,
  markWebsiteAutoRebuildReady,
  getWebsiteRebuildStatus,
  triggerWebsiteRebuildNow,
} from "./website-rebuild";

function registerWebsiteRebuildAdminRoutes(strapi: any) {
  strapi.server.routes({
    type: "admin",
    routes: [
      {
        method: "GET",
        path: "/website-rebuild/status",
        handler: async (ctx: any) => {
          ctx.body = await getWebsiteRebuildStatus(strapi);
        },
        config: { policies: [] },
      },
      {
        method: "POST",
        path: "/website-rebuild/trigger",
        handler: async (ctx: any) => {
          const result = await triggerWebsiteRebuildNow(strapi);
          if (!result.ok) {
            ctx.throw(
              result.error === "not configured" ? 503 : 502,
              result.error || "rebuild failed",
            );
          }
          ctx.body = { ok: true };
        },
        config: { policies: [] },
      },
    ],
  });
}

function camelToLabel(field: string): string {
  const upperAbbreviations: Record<string, string> = {
    seo: "SEO",
    cta: "CTA",
    url: "URL",
    og: "OG",
    bg: "BG",
    id: "ID",
  };

  const words = field
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .trim()
    .split(/\s+/);

  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (upperAbbreviations[lower]) return upperAbbreviations[lower];
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      return lower;
    })
    .join(" ");
}

function applyLabels(metadatas: Record<string, any>) {
  for (const field of Object.keys(metadatas)) {
    const label = camelToLabel(field);
    if (metadatas[field]?.edit) {
      metadatas[field].edit.label = label;
    }
    if (metadatas[field]?.list) {
      metadatas[field].list.label = label;
    }
  }
}

const singleTypeUids = [
  "api::homepage.homepage",
  "api::about-page.about-page",
  "api::blog-page.blog-page",
  "api::career-page.career-page",
  "api::contact-page.contact-page",
  "api::projects-page.projects-page",
  "api::global-setting.global-setting",
];

const collectionTypeUids = [
  "api::blog-post.blog-post",
  "api::career-position.career-position",
  "api::project.project",
  "api::service.service",
  "api::client.client",
  "api::tag.tag",
  "api::team-member.team-member",
];

const componentUids = [
  "about.intro",
  "contact.form-subject",
  "content.highlight-block",
  "content.image-block",
  "content.text-block",
  "homepage.blog-section",
  "homepage.clients-section",
  "homepage.cta-banner",
  "homepage.hero",
  "homepage.projects-section",
  "homepage.services-section",
  "project.case-study",
  "service.general",
  "service.value-proposition",
  "service.activity",
  "service.benefit",
  "service.tool",
  "shared.hero",
  "shared.legal-link",
  "shared.opening-hours",
  "shared.seo",
  "shared.social-link",
  "career.why-us-item",
  "career.work-with-us",
  "career.why-us-section",
];

async function updateAllLabels(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "content_manager" });
  const allContentTypeUids = [...singleTypeUids, ...collectionTypeUids];

  for (const uid of allContentTypeUids) {
    const storeKey = `configuration_content_types::${uid}`;
    const existing = await store.get({ key: storeKey });
    if (!existing) continue;

    const config = existing;

    if (singleTypeUids.includes(uid) && config.settings) {
      config.settings.mainField = "id";
      config.settings.defaultSortBy = "id";
    }

    if (uid === "api::service.service") {
      if (config.settings) {
        config.settings.mainField = "title";
      }
      if (config.layouts) {
        config.layouts.list = ["id", "title"];
      }
    }

    if (config.metadatas) {
      applyLabels(config.metadatas);
    }

    if (config.layouts?.edit) {
      const seoIdx = config.layouts.edit.findIndex(
        (row: { name: string }[]) =>
          row.some((col: { name: string }) => col.name === "seo")
      );
      if (seoIdx !== -1 && seoIdx !== config.layouts.edit.length - 1) {
        const [seoRow] = config.layouts.edit.splice(seoIdx, 1);
        config.layouts.edit.push(seoRow);
      }

      if (uid === "api::service.service") {
        const hasTitle = config.layouts.edit.some(
          (row: { name: string }[]) => row.some((col: { name: string }) => col.name === "title")
        );
        if (!hasTitle) {
          config.layouts.edit.unshift([{ name: "title", size: 6 }, { name: "order", size: 4 }]);
        }

        const preferredOrder = ["title", "general", "valueProposition"];
        const reordered: any[] = [];
        for (const name of preferredOrder) {
          const idx = config.layouts.edit.findIndex(
            (row: { name: string }[]) =>
              row.some((col: { name: string }) => col.name === name)
          );
          if (idx !== -1) {
            reordered.push(...config.layouts.edit.splice(idx, 1));
          }
        }
        config.layouts.edit = [...reordered, ...config.layouts.edit];
      }
    }

    await store.set({ key: storeKey, value: config });
  }

  for (const uid of componentUids) {
    const storeKey = `configuration_components::${uid}`;
    const existing = await store.get({ key: storeKey });
    if (!existing) continue;

    const config = existing;

    if (config.metadatas) {
      applyLabels(config.metadatas);
    }

    await store.set({ key: storeKey, value: config });
  }
}

async function uploadSvgIcon(strapi: any, filePath: string, name: string): Promise<number | null> {
  const fs = require("fs");
  const path = require("path");

  const existing = await strapi.db
    .query("plugin::upload.file")
    .findOne({ where: { name } });
  if (existing) return existing.id;

  if (!fs.existsSync(filePath)) {
    strapi.log.warn(`SVG icon not found: ${filePath}`);
    return null;
  }

  const stats = fs.statSync(filePath);

  const fileData = {
    filepath: filePath,
    originalFilename: `${name}.svg`,
    mimetype: "image/svg+xml",
    size: stats.size,
  };

  try {
    const uploaded = await strapi
      .plugin("upload")
      .service("upload")
      .upload({
        data: {},
        files: fileData,
      });
    return uploaded?.[0]?.id || null;
  } catch (err: any) {
    strapi.log.error(`uploadSvgIcon error for ${name} at ${filePath}: ${err.stack || err.message}`);
    return null;
  }
}

const SERVICE_SEED_DATA = [
  {
    slug: "ux-kutatas",
    title: "UX Kutatás",
    subtitle: "Felhasználók megértése, adatalappal",
    heroDescription: "Feltárjuk a felhasználói igényeket, viselkedési mintákat és fájdalompontokat, hogy a termékfejlesztés valós adatokon alapuljon — ne feltételezéseken.",
    valueQuestion: "Tudod pontosan, mit akarnak a felhasználóid? Vagy csak azt, amit gondolsz, hogy akarnak?",
    valueAnswer: "A legjobb digitális termékek mögött mindig mély felhasználói megértés áll. Mi segítünk eljutni oda.",
    serviceIcon: "search",
    activityIcons: ["target", "zap", "users", "search", "bar-chart-3", "file-check"],
    benefitIcons: ["shield", "rocket", "heart"],
    activities: [
      { title: "Felhasználói interjúk", description: "Strukturált interjúk készítése célcsoportokkal, hogy megértsük a valós motivációkat és akadályokat." },
      { title: "Használhatósági tesztelés", description: "Meglévő vagy tervezett felületek tesztelése valós felhasználókkal, hogy feltárjuk a problémás pontokat." },
      { title: "Perszóna készítés", description: "Adatokra épülő felhasználói perszónák létrehozása, amelyek a teljes csapat számára használhatók." },
      { title: "Versenytárs elemzés", description: "A piaci környezet és a versenytársak digitális megoldásainak áttekintése." },
      { title: "Felhasználói út térképezés", description: "User journey map-ek készítése, amelyek vizualizálják a felhasználói élmény egészét." },
      { title: "Adatelemzés", description: "Meglévő analitikai adatok értelmezése és összevetése a kvalitatív eredményekkel." },
    ],
    benefits: [
      { title: "Kisebb fejlesztési kockázat", description: "A kutatás csökkenti annak esélyét, hogy olyan funkciókat fejlesszünk, amelyeket senki sem használ." },
      { title: "Gyorsabb piacra kerülés", description: "A célzott fejlesztés kevésbé pazarolja az erőforrásokat és gyorsabban jut el az értékes megoldásig." },
      { title: "Magasabb felhasználói elégedettség", description: "Az adatokra építő tervezés eredményeképpen a felhasználók elégedettebbek lesznek a végtermékkel." },
    ],
    tools: ["Hotjar", "Google Analytics", "Maze", "Lookback", "Miro", "Optimal Workshop", "UserTesting", "Dovetail", "FigJam"],
    processSteps: [
      { step: "01", title: "Megismerés", description: "Megismerjük az üzleti célokat, a meglévő adatokat és a kutatás céljait. Közösen meghatározzuk a kutatási kérdéseket." },
      { step: "02", title: "Kutatástervezés", description: "Kiválasztjuk a megfelelő módszertant, elkészítjük a kutatási tervet és a toborzási kritériumokat." },
      { step: "03", title: "Terepmunka", description: "Elvégezzük az interjúkat, teszteket és megfigyeléseket a meghatározott módszertan szerint." },
      { step: "04", title: "Elemzés és szintézis", description: "Az összegyűjtött adatokat elemezzük, mintákat azonosítunk és akcióképes insightokat fogalmazunk meg." },
      { step: "05", title: "Átadás és javaslatok", description: "Prezentáljuk az eredményeket és konkrét, prioritizált javaslatokkal segítjük a továbblépést." },
    ],
  },
  {
    slug: "ui-design",
    title: "UI Design",
    subtitle: "Felületek, amelyek működnek és hatnak",
    heroDescription: "Olyan felhasználói felületeket tervezünk, amelyek nem csak szépek, hanem érthetőek, használhatók és üzleti eredményeket hoznak.",
    valueQuestion: "Szükséged van egy szakértőre, aki érti az üzleted céljait és a felhasználók elvárásait is?",
    valueAnswer: "Megértjük a felhasználóid elvárásait, szokásait és céljait. Erre építjük a felületeket.",
    serviceIcon: "monitor",
    activityIcons: ["palette", "book-open", "monitor", "eye", "zap", "file-check"],
    benefitIcons: ["shield", "rocket", "heart"],
    activities: [
      { title: "Vizuális tervezés", description: "Pixel-pontos UI tervek készítése, amelyek tükrözik a márka identitását és a felhasználói elvárásokat." },
      { title: "Design rendszer építés", description: "Skálázható, konzisztens komponenskönyvtárak létrehozása, amelyek gyorsítják a fejlesztést." },
      { title: "Prototípus készítés", description: "Interaktív prototípusok, amelyekkel már a fejlesztés előtt tesztelhető a felhasználói élmény." },
      { title: "Reszponzív design", description: "Minden képernyőméretre optimalizált felületek, mobilon és desktopon egyaránt." },
      { title: "Motion design", description: "Célzott mikro-animációk és átmenetek, amelyek javítják a felhasználói élményt." },
      { title: "Fejlesztői átadás", description: "Részletes specifikáció és asset-készítés a zökkenőmentes implementációért." },
    ],
    benefits: [
      { title: "Erősebb márkaélmény", description: "A konzisztens, átgondolt vizuális rendszer erősíti a márkaészlelést és a bizalmat." },
      { title: "Magasabb konverzió", description: "A jól megtervezett felhasználói útvonalak több látogatót alakítanak ügyféllé." },
      { title: "Hatékonyabb fejlesztés", description: "A design rendszer csökkenti a fejlesztési időt és a kommunikációs súrlódásokat." },
    ],
    tools: ["Figma", "Adobe Creative Suite", "Framer", "Principle", "Storybook", "Zeplin", "Abstract", "InVision"],
    processSteps: [
      { step: "01", title: "Vizuális irány", description: "Moodboard-ok és stílus-explorációk készítése, amelyek segítenek megtalálni a megfelelő vizuális hangot." },
      { step: "02", title: "Wireframe és struktúra", description: "Az oldal struktúrájának és információs architektúrájának kialakítása alacsony-fidelitású tervekkel." },
      { step: "03", title: "UI tervezés", description: "A végleges, magas fidelitású felületi tervek elkészítése minden breakpointra." },
      { step: "04", title: "Prototípus és teszt", description: "Kattintható prototípus készítése és tesztelése felhasználókkal a végső finomhangolás előtt." },
      { step: "05", title: "Design rendszer és átadás", description: "A végleges design rendszer dokumentálása és átadása a fejlesztő csapatnak." },
    ],
  },
  {
    slug: "akadalymentesites",
    title: "Akadálymentesítés",
    subtitle: "Digitális termékek mindenki számára",
    heroDescription: "Segítünk, hogy digitális termékeid mindenki számára elérhetőek és használhatóak legyenek — a jogszabályi megfeleléstől a valódi inkluzivitásig.",
    valueQuestion: "A felhasználóid jelentős része akadályokba ütközik a terméked használata során — tudsz róla?",
    valueAnswer: "Az akadálymentesítés nem csak kötelezettség. Jobb terméket jelent mindenkinek.",
    serviceIcon: "eye",
    activityIcons: ["target", "file-check", "monitor", "eye", "users", "bar-chart-3"],
    benefitIcons: ["shield", "rocket", "heart"],
    activities: [
      { title: "Akadálymentesítési audit", description: "Meglévő weboldalak és alkalmazások átfogó WCAG 2.1 szabálynak megfelelő értékelése." },
      { title: "Javítási terv készítés", description: "Prioritizált, lépésről lépésre követhető javítási terv összeállítása a feltárt problémák alapján." },
      { title: "Asszisztív technológiás tesztelés", description: "Tesztelés képernyőolvasókkal, billentyűzetes navigációval és egyéb segédeszközökkel." },
      { title: "Akadálymentes design review", description: "Design fázisban végzett ellenőrzés, mielőtt a fejlesztés megkezdődne." },
      { title: "Csapat képzés", description: "Fejlesztők, tervezők és tartalomkészítők képzése az akadálymentes gyakorlatokról." },
      { title: "Folyamatos monitoring", description: "Rendszeres ellenőrzés és jelentéskészítés, hogy a megfelelés hosszú távon is megmaradjon." },
    ],
    benefits: [
      { title: "Jogszabályi megfelelés", description: "Az EU Akadálymentesítési irányelv és a WCAG 2.1 szabványoknak való megfelelés biztosítása." },
      { title: "Szélesebb elérhetőség", description: "A populáció mintegy 15%-a él valamilyen fogyatékossággal — az akadálymentes termék őket is eléri." },
      { title: "Jobb felhasználói élmény mindenkinek", description: "Az akadálymentesítés javítja a használhatóságot minden felhasználó számára, nem csak a fogyatékossággal élőkét." },
    ],
    tools: ["axe DevTools", "WAVE", "Lighthouse", "NVDA", "VoiceOver", "JAWS", "Pa11y", "Contrast Checker", "Accessibility Insights"],
    processSteps: [
      { step: "01", title: "Helyzetértékelés", description: "A jelenlegi állapot felmérése automatizált és manuális eszközökkel, WCAG 2.1 szabvány szerint." },
      { step: "02", title: "Részletes audit", description: "Oldalról oldalra haladó, komponensszintű vizsgálat dokumentált eredményekkel." },
      { step: "03", title: "Javítási ütemterv", description: "Prioritizált feladatlista a kritikus, közepes és alacsony súlyosságú problémákra bontva." },
      { step: "04", title: "Implementációs támogatás", description: "A fejlesztő csapat támogatása a javítások során, kód review-kkal és konzultációval." },
      { step: "05", title: "Végső validáció", description: "A javítások utáni újratesztelés és a megfelelési nyilatkozat elkészítése." },
    ],
  },
];

async function migrateSlugToGeneral(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });

  const migrationDone = await store.get({ key: "service_slug_to_general_v1" });
  if (migrationDone) {
    strapi.log.info("Slug migration: already completed (flag set) — skipping");
    return;
  }

  strapi.log.info("Slug migration: populating slug on general components...");

  const services = await strapi.documents("api::service.service").findMany({
    populate: ["general"],
  });

  if (services.length === 0) {
    strapi.log.info("Slug migration: no services found — skipping");
    await store.set({ key: "service_slug_to_general_v1", value: true });
    return;
  }

  let legacySlugs: Record<string, string> = {};
  try {
    const hasSlugCol = await knex.raw(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'strapi' AND table_name = 'services' AND column_name = 'slug'`
    );
    if (hasSlugCol.rows.length > 0) {
      const rows = await knex.select("document_id", "slug").from("strapi.services");
      for (const r of rows) {
        if (r.slug && r.document_id) legacySlugs[r.document_id] = r.slug;
      }
      strapi.log.info(`Slug migration: found ${Object.keys(legacySlugs).length} legacy slug(s) from services table`);
    }
  } catch {
    strapi.log.info("Slug migration: legacy slug column not available — using seed fallback");
  }

  for (const svc of services) {
    if (svc.general?.slug) {
      strapi.log.info(`Slug migration: "${svc.general.slug}" already has slug — skipping`);
      continue;
    }

    if (!svc.general) {
      strapi.log.warn(`Slug migration: service (documentId="${svc.documentId}") has no general component — skipping`);
      continue;
    }

    const slug = legacySlugs[svc.documentId]
      || SERVICE_SEED_DATA.find((s) => s.title === svc.general.title)?.slug;

    if (!slug) {
      strapi.log.warn(`Slug migration: no slug source for service (documentId="${svc.documentId}", title="${svc.general.title}") — skipping`);
      continue;
    }

    await strapi.documents("api::service.service").update({
      documentId: svc.documentId,
      data: {
        general: {
          ...svc.general,
          slug,
        },
      },
      status: "published",
    });
    strapi.log.info(`Slug migration: set slug="${slug}" on service "${svc.general?.title}"`);
  }

  const postCheck = await strapi.documents("api::service.service").findMany({
    populate: ["general"],
  });
  const missing = postCheck.filter((s: any) => !s.general?.slug);
  if (missing.length > 0) {
    strapi.log.error(`Slug migration: ${missing.length} service(s) still missing general.slug — will retry on next restart`);
    for (const m of missing) {
      strapi.log.error(`  - documentId=${m.documentId}, title="${m.general?.title || "(no title)"}"`);
    }
    return;
  }

  await store.set({ key: "service_slug_to_general_v1", value: true });
  strapi.log.info("Slug migration: completed successfully");
}

async function migrateServicesToSections(strapi: any) {
  const knex = strapi.db.connection;
  const path = require("path");

  const store = strapi.store({ type: "plugin", name: "migrations" });
  const migrationDone = await store.get({ key: "service_sections_v1" });
  if (migrationDone) {
    strapi.log.info("Service migration: already completed (flag set) — skipping");
    return;
  }


  strapi.log.info("Service migration: starting service restructure (via document service)...");

  const strapiRoot = path.resolve(__dirname, "..", "..");
  const iconsDir = path.join(strapiRoot, "src", "seed-icons");

  const iconCache: Record<string, number> = {};
  async function getIconId(name: string): Promise<number | null> {
    if (iconCache[name] !== undefined) return iconCache[name];
    const filePath = path.join(iconsDir, `${name}.svg`);
    const id = await uploadSvgIcon(strapi, filePath, name);
    if (id) iconCache[name] = id;
    return id;
  }

  const services = await strapi.documents("api::service.service").findMany({
    populate: ["activities", "benefits", "tools", "general", "general.heroImage", "general.icon", "valueProposition"],
  });

  if (services.length === 0) {
    strapi.log.info("Service migration: no services found — skipping");
    return;
  }

  let slugByDocId: Record<string, string> = {};
  try {
    const hasSlugCol = await knex.raw(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'strapi' AND table_name = 'services' AND column_name = 'slug'`
    );
    if (hasSlugCol.rows.length > 0) {
      const slugRows = await knex.select("document_id", "slug").from("strapi.services");
      for (const row of slugRows) {
        if (row.slug) slugByDocId[row.document_id] = row.slug;
      }
    }
  } catch {
    strapi.log.info("Service migration: legacy slug column not available");
  }

  for (const svc of services) {
    const svcSlug = svc.general?.slug || slugByDocId[svc.documentId] || "";
    const seed = SERVICE_SEED_DATA.find((s) => s.slug === svcSlug);
    if (!seed) {
      strapi.log.info(`Service migration: no seed data for "${svcSlug}" — skipping`);
      continue;
    }

    strapi.log.info(`Service migration: processing "${svcSlug}"...`);

    const serviceIconId = await getIconId(seed.serviceIcon);
    const howWeWorkHtml = seed.processSteps
      .map((ps) => `<h3>${ps.step}. ${ps.title}</h3>\n<p>${ps.description}</p>`)
      .join("\n\n");

    const svcDbRows = await knex
      .select("id")
      .from("strapi.services")
      .where("document_id", svc.documentId);
    const svcDbIds = svcDbRows.map((r: any) => r.id);

    const existingHeroImage = await knex
      .select("fr.file_id")
      .from("strapi.files_related_mph as fr")
      .where("fr.related_type", "api::service.service")
      .whereIn("fr.related_id", svcDbIds)
      .where("fr.field", "heroImage")
      .first()
      .catch(() => null);
    const heroImageId = existingHeroImage?.file_id || null;

    const activityIcons: (number | null)[] = [];
    for (let i = 0; i < (svc.activities || []).length; i++) {
      const iconName = seed.activityIcons[i % seed.activityIcons.length];
      activityIcons.push(await getIconId(iconName));
    }

    const benefitIcons: (number | null)[] = [];
    for (let i = 0; i < (svc.benefits || []).length; i++) {
      const iconName = seed.benefitIcons[i % seed.benefitIcons.length];
      benefitIcons.push(await getIconId(iconName));
    }

    const existingGeneral = svc.general || {};
    const existingVP = svc.valueProposition || {};

    const resolvedTitle = existingGeneral.title || seed.title;
    await strapi.documents("api::service.service").update({
      documentId: svc.documentId,
      data: {
        title: resolvedTitle,
        general: {
          slug: existingGeneral.slug || svcSlug,
          title: resolvedTitle,
          subtitle: existingGeneral.subtitle || seed.subtitle,
          heroDescription: existingGeneral.heroDescription || seed.heroDescription,
          icon: existingGeneral.icon?.id || serviceIconId || undefined,
          heroImage: existingGeneral.heroImage?.id || heroImageId || undefined,
        },
        valueProposition: {
          question: existingVP.question || seed.valueQuestion,
          answer: existingVP.answer || seed.valueAnswer,
        },
        howWeWork: svc.howWeWork || howWeWorkHtml,
        activities: (svc.activities || []).map((a: any, i: number) => ({
          title: a.title,
          description: a.description,
          icon: a.icon?.id || activityIcons[i] || undefined,
        })),
        benefits: (svc.benefits || []).map((b: any, i: number) => ({
          title: b.title,
          description: b.description,
          icon: b.icon?.id || benefitIcons[i] || undefined,
        })),
      },
      status: "published",
    });

    strapi.log.info(`Service migration: "${svcSlug}" done`);
  }

  await store.set({ key: "service_sections_v1", value: true });
  strapi.log.info("Service migration: completed successfully");
}

async function syncServiceTitles(strapi: any) {
  const knex = strapi.db.connection;
  const services = await strapi.documents("api::service.service").findMany({
    populate: ["general"],
  });
  let synced = 0;
  for (const svc of services) {
    const generalTitle = svc.general?.title;
    if (generalTitle && svc.title !== generalTitle) {
      await knex("strapi.services")
        .where("document_id", svc.documentId)
        .update({ title: generalTitle });
      synced++;
    }
  }
  if (synced > 0) {
    strapi.log.info(`Service title sync: updated ${synced} service(s)`);
  }
}

async function backfillServiceSections(strapi: any) {
  const path = require("path");
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "service_sections_backfill_v1" });
  if (done) {
    strapi.log.info("Service sections backfill: already completed (flag set) — skipping");
    return;
  }

  const strapiRoot = path.resolve(__dirname, "..", "..");
  const iconsDir = path.join(strapiRoot, "src", "seed-icons");
  const iconCache: Record<string, number> = {};
  async function getIconId(name: string): Promise<number | null> {
    if (iconCache[name] !== undefined) return iconCache[name];
    const filePath = path.join(iconsDir, `${name}.svg`);
    const id = await uploadSvgIcon(strapi, filePath, name);
    if (id) iconCache[name] = id;
    return id;
  }

  const services = await strapi.documents("api::service.service").findMany({
    populate: ["activities", "benefits", "tools", "general"],
  });

  if (services.length === 0) {
    strapi.log.info("Service sections backfill: no services found — will retry on next restart");
    return;
  }

  let filled = 0;
  for (const svc of services) {
    const svcSlug = svc.general?.slug || "";
    const seed = SERVICE_SEED_DATA.find((s) => s.slug === svcSlug);
    if (!seed) {
      strapi.log.info(`Service sections backfill: no seed data for "${svcSlug}" — skipping`);
      continue;
    }

    const hasActivities = (svc.activities || []).length > 0;
    const hasBenefits = (svc.benefits || []).length > 0;
    const hasTools = (svc.tools || []).length > 0;
    if (hasActivities && hasBenefits && hasTools) {
      strapi.log.info(`Service sections backfill: "${svcSlug}" already has content — skipping`);
      continue;
    }

    const data: Record<string, any> = {};

    if (!hasActivities && Array.isArray((seed as any).activities)) {
      const acts: any[] = [];
      for (let i = 0; i < (seed as any).activities.length; i++) {
        const iconName = seed.activityIcons[i % seed.activityIcons.length];
        acts.push({
          title: (seed as any).activities[i].title,
          description: (seed as any).activities[i].description,
          icon: (await getIconId(iconName)) || undefined,
        });
      }
      data.activities = acts;
    }

    if (!hasBenefits && Array.isArray((seed as any).benefits)) {
      const bens: any[] = [];
      for (let i = 0; i < (seed as any).benefits.length; i++) {
        const iconName = seed.benefitIcons[i % seed.benefitIcons.length];
        bens.push({
          title: (seed as any).benefits[i].title,
          description: (seed as any).benefits[i].description,
          icon: (await getIconId(iconName)) || undefined,
        });
      }
      data.benefits = bens;
    }

    if (!hasTools && Array.isArray((seed as any).tools)) {
      data.tools = (seed as any).tools.map((name: string) => ({ name }));
    }

    if (Object.keys(data).length === 0) continue;

    await strapi.documents("api::service.service").update({
      documentId: svc.documentId,
      data,
    });
    await strapi.documents("api::service.service").publish({
      documentId: svc.documentId,
    });
    filled++;
    strapi.log.info(`Service sections backfill: filled empty sections for "${svcSlug}"`);
  }

  const targetSlugs = SERVICE_SEED_DATA.map((s) => s.slug);
  const postCheck = await strapi.documents("api::service.service").findMany({
    populate: ["activities", "benefits", "tools", "general"],
  });
  const incomplete = targetSlugs.filter((slug) => {
    const matches = postCheck.filter((s: any) => s.general?.slug === slug);
    if (matches.length === 0) return true;
    return matches.some(
      (s: any) =>
        (s.activities || []).length === 0 ||
        (s.benefits || []).length === 0 ||
        (s.tools || []).length === 0,
    );
  });

  if (incomplete.length > 0) {
    strapi.log.warn(
      `Service sections backfill: still incomplete for [${incomplete.join(", ")}] — flag not set, will retry on next restart`,
    );
    return;
  }

  await store.set({ key: "service_sections_backfill_v1", value: true });
  strapi.log.info(`Service sections backfill: completed (${filled} service(s) updated)`);
}

const PUBLIC_WRITE_SUFFIXES = ["-submission"];

function isPublicWriteType(uid: string): boolean {
  const typeName = uid.replace(/^api::/, "").split(".")[0];
  return PUBLIC_WRITE_SUFFIXES.some((suffix) => typeName.endsWith(suffix));
}

async function ensurePublicPermissions(strapi: any) {
  const actions: string[] = [];

  for (const [uid, contentType] of Object.entries<any>(strapi.contentTypes)) {
    if (!uid.startsWith("api::")) continue;

    actions.push(`${uid}.find`);

    if (contentType.kind !== "singleType") {
      actions.push(`${uid}.findOne`);
    }

    if (isPublicWriteType(uid)) {
      actions.push(`${uid}.create`);
    }
  }

  const publicRole = await strapi
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "public" } });

  if (!publicRole) {
    strapi.log.warn("Public role not found — skipping permission setup");
    return;
  }

  const existingPermissions = await strapi
    .query("plugin::users-permissions.permission")
    .findMany({ where: { role: publicRole.id } });

  const existingActions = new Set(existingPermissions.map((p: any) => p.action));

  let created = 0;
  for (const action of actions) {
    if (!existingActions.has(action)) {
      await strapi.query("plugin::users-permissions.permission").create({
        data: { action, role: publicRole.id },
      });
      created++;
    }
  }

  if (created > 0) {
    strapi.log.info(`Public permissions: created ${created} permission(s)`);
  } else {
    strapi.log.info("Public permissions: all already set");
  }
}

async function resetAdminFromEnv(strapi: any) {
  const email = (process.env.ADMIN_RESET_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_RESET_PASSWORD || "";
  if (!email || !password) return;
  if (password.length < 8) {
    strapi.log.error(
      "[admin-reset] ADMIN_RESET_PASSWORD must be at least 8 characters — skipping",
    );
    return;
  }
  try {
    const userService = strapi.service("admin::user");
    const existing = await strapi.db
      .query("admin::user")
      .findOne({ where: { email } });
    if (existing) {
      await userService.updateById(existing.id, {
        password,
        isActive: true,
        blocked: false,
      });
      strapi.log.info(
        `[admin-reset] password reset for existing admin: ${email}`,
      );
    } else {
      const superAdminRole = await strapi.db
        .query("admin::role")
        .findOne({ where: { code: "strapi-super-admin" } });
      if (!superAdminRole) {
        strapi.log.error(
          "[admin-reset] super admin role not found — skipping",
        );
        return;
      }
      await userService.create({
        email,
        firstname: "Works",
        lastname: "Admin",
        password,
        isActive: true,
        roles: [superAdminRole.id],
      });
      strapi.log.info(`[admin-reset] created new super admin: ${email}`);
    }
  } catch (err: any) {
    strapi.log.error(`[admin-reset] failed: ${err.message}`);
  }
}

export default {
  register({ strapi }) {
    registerWebsiteRebuildAdminRoutes(strapi);
  },
  async bootstrap({ strapi }) {
    await resetAdminFromEnv(strapi);
    await updateAllLabels(strapi);
    await ensurePublicPermissions(strapi);
    setupWebsiteAutoRebuild(strapi);

    const httpServer = strapi.server?.httpServer;
    if (httpServer) {
      httpServer.once("listening", () => {
        migrateServicesToSections(strapi)
          .then(() => migrateSlugToGeneral(strapi))
          .then(() => syncServiceTitles(strapi))
          .then(() => backfillServiceSections(strapi))
          .then(() => strapi.log.info("Bootstrap tasks completed successfully"))
          .catch((err: any) => {
            strapi.log.error(`Bootstrap task failed: ${err.message}`);
            strapi.log.error(`Stack: ${err.stack}`);
          })
          .finally(() => markWebsiteAutoRebuildReady());
      });
    } else {
      await migrateServicesToSections(strapi);
      await migrateSlugToGeneral(strapi);
      await syncServiceTitles(strapi);
      await backfillServiceSections(strapi);
      strapi.log.info("Bootstrap tasks completed successfully");
      markWebsiteAutoRebuildReady();
    }
  },
  destroy(/* { strapi } */) {},
};
