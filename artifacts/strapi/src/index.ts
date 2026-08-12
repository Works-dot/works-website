import {
  setupWebsiteAutoRebuild,
  markWebsiteAutoRebuildReady,
  getWebsiteRebuildStatus,
  triggerWebsiteRebuildNow,
} from "./website-rebuild";
import { registerCvUploadRoutes } from "./cv-upload";

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

const SERVICE_FIELD_LABELS: Record<string, { label: string; description?: string }> = {
  title: { label: "Cím (admin lista)", description: "A szolgáltatás neve az admin listában — a weboldalon a hero cím jelenik meg" },
  order: { label: "Sorrend", description: "A szolgáltatások sorrendje a listákban" },
  general: { label: "1. Általános adatok + fejléc (hero)", description: "Webcím (slug), cím, alcím, hero leírás és ikonok" },
  definitionSection: { label: "2. Definíció („Mi az a …?”)", description: "A hero utáni szöveges blokk: címsor és leírás arról, mit jelent a szolgáltatás. Üresen hagyva nem jelenik meg." },
  questionsSection: { label: "3. „Milyen kérdésekre segítünk választ találni?”", description: "Kérdéskártyás szekció a definíció alatt" },
  helpSection: { label: "4. „Miben tudunk segíteni?”", description: "Ikonos kártyarács a szolgáltatás területeiről" },
  processSection: { label: "5. „Hogyan dolgozunk?”", description: "Számozott folyamatlépések" },
  deliverablesSection: { label: "6. „Amit a projektből kapsz”", description: "Kis vagy nagy kártyás átadandók" },
  ctaBanner: { label: "7. CTA banner", description: "Sötét hátterű felhívás szekció (cím + gomb) a Projektpéldák előtt — ugyanolyan, mint a főoldalon" },
  projectExamplesIntro: { label: "8. Projektpéldák — bevezető", description: "A Projektpéldák szekció címe és leírása" },
  relatedProjects: { label: "8. Projektpéldák — kapcsolt projektek", description: "Az itt kiválasztott projektek jelennek meg a Projektpéldák szekcióban" },
  faqSection: { label: "9. GYIK szekció", description: "Gyakran ismételt kérdések" },
  relatedServicesIntro: { label: "10. Kapcsolódó szolgáltatások — bevezető", description: "A Kapcsolódó szolgáltatások szekció címe és leírása" },
  relatedServices: { label: "10. Kapcsolódó szolgáltatások — lista", description: "Az itt kiválasztott szolgáltatások jelennek meg az oldal alján" },
  seo: { label: "11. SEO beállítások", description: "Kereső- és megosztási beállítások (meta cím, leírás, kép)" },
};

const SERVICE_EDIT_ORDER = [
  "title",
  "order",
  "general",
  "definitionSection",
  "questionsSection",
  "helpSection",
  "processSection",
  "deliverablesSection",
  "ctaBanner",
  "projectExamplesIntro",
  "relatedProjects",
  "faqSection",
  "relatedServicesIntro",
  "relatedServices",
  "seo",
];

const CONTACT_FIELD_LABELS: Record<string, { label: string; description?: string }> = {
  hero: { label: "1. Fejléc (hero)", description: "A kapcsolat oldal címe, leírása és háttérképe" },
  formHeading: { label: "2. Űrlap — címsor", description: "Az üzenetküldő űrlap címe" },
  formSubjects: { label: "3. Űrlap — tárgy opciók", description: "A Tárgy legördülő menü elemei. A „Karrier tárgy?” kapcsolóval jelölhető, melyik tárgynál jelenjenek meg a hozzájárulás-jelölőnégyzetek." },
  careerConsent: { label: "4. Űrlap — karrier hozzájárulás-jelölőnégyzetek", description: "Csak a karrierként megjelölt tárgy kiválasztásakor jelennek meg. A szövegben link is elhelyezhető: [adatkezelési tájékoztató](/adatkezeles)" },
  successTitle: { label: "5. Sikeres küldés — cím" },
  successMessage: { label: "5. Sikeres küldés — üzenet" },
  mapHeading: { label: "6. Térkép — címsor" },
  mapEmbedUrl: { label: "6. Térkép — beágyazási URL" },
  backgroundImage: { label: "7. Oldal háttérképe" },
  seo: { label: "8. SEO beállítások", description: "Kereső- és megosztási beállítások (meta cím, leírás, kép)" },
};

const CONTACT_EDIT_ORDER = [
  "hero",
  "formHeading",
  "formSubjects",
  "careerConsent",
  "successTitle",
  "successMessage",
  "mapHeading",
  "mapEmbedUrl",
  "backgroundImage",
  "seo",
];

const COMPONENT_FIELD_LABELS: Record<string, Record<string, { label: string; description?: string }>> = {
  "contact.form-subject": {
    label: { label: "Megnevezés", description: "Ez látszik a legördülő menüben" },
    value: { label: "Érték", description: "Technikai azonosító (pl. karrier)" },
    isCareer: { label: "Karrier tárgy?", description: "Ha be van kapcsolva, ennél a tárgynál jelennek meg a hozzájárulás-jelölőnégyzetek" },
  },
  "contact.career-consent": {
    checkbox1Text: { label: "1. jelölőnégyzet szövege", description: "Link beszúrása: [adatkezelési tájékoztató](/adatkezeles) — üresen hagyva a jelölőnégyzet nem jelenik meg" },
    checkbox2Text: { label: "2. jelölőnégyzet szövege", description: "Link beszúrása: [link szövege](/cel-oldal) — üresen hagyva a jelölőnégyzet nem jelenik meg" },
  },
};

const PRIVACY_FIELD_LABELS: Record<string, { label: string; description?: string }> = {
  heading: { label: "1. Címsor", description: "Az oldal főcíme (pl. Adatkezelési tájékoztató)" },
  body: { label: "2. Szöveg", description: "Az oldal teljes szövege. Formázható: ## alcím, **félkövér**, - lista, [link szövege](https://cel-oldal)" },
  seo: { label: "3. SEO beállítások", description: "Kereső- és megosztási beállítások (meta cím, leírás, kép)" },
};

const PRIVACY_EDIT_ORDER = ["heading", "body", "seo"];

const singleTypeUids = [
  "api::homepage.homepage",
  "api::about-page.about-page",
  "api::career-page.career-page",
  "api::contact-page.contact-page",
  "api::privacy-page.privacy-page",
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
  "contact.career-consent",
  "content.highlight-block",
  "content.image-block",
  "content.text-block",
  "homepage.blog-section",
  "homepage.cta-banner",
  "homepage.hero",
  "homepage.projects-section",
  "homepage.services-section",
  "project.case-study",
  "service.general",
  "service.section-intro",
  "service.question-card",
  "service.questions-section",
  "service.help-card",
  "service.help-section",
  "service.process-step",
  "service.process-section",
  "service.bullet-point",
  "service.deliverable-card",
  "service.deliverable-group",
  "service.deliverables-section",
  "service.faq-item",
  "service.faq-section",
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

      if (uid === "api::service.service") {
        for (const removed of ["valueProposition", "activities", "benefits", "tools", "howWeWork"]) {
          delete config.metadatas[removed];
        }
        for (const [field, meta] of Object.entries(SERVICE_FIELD_LABELS)) {
          if (config.metadatas[field]?.edit) {
            config.metadatas[field].edit.label = meta.label;
            if (meta.description) {
              config.metadatas[field].edit.description = meta.description;
            }
          }
          if (config.metadatas[field]?.list) {
            config.metadatas[field].list.label = meta.label;
          }
        }
      }

      if (uid === "api::privacy-page.privacy-page") {
        for (const [field, meta] of Object.entries(PRIVACY_FIELD_LABELS)) {
          if (config.metadatas[field]?.edit) {
            config.metadatas[field].edit.label = meta.label;
            if (meta.description) {
              config.metadatas[field].edit.description = meta.description;
            }
          }
          if (config.metadatas[field]?.list) {
            config.metadatas[field].list.label = meta.label;
          }
        }
      }

      if (uid === "api::contact-page.contact-page") {
        for (const [field, meta] of Object.entries(CONTACT_FIELD_LABELS)) {
          if (config.metadatas[field]?.edit) {
            config.metadatas[field].edit.label = meta.label;
            if (meta.description) {
              config.metadatas[field].edit.description = meta.description;
            }
          }
          if (config.metadatas[field]?.list) {
            config.metadatas[field].list.label = meta.label;
          }
        }
      }
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
        const removedFields = ["valueProposition", "activities", "benefits", "tools", "howWeWork"];
        config.layouts.edit = config.layouts.edit
          .map((row: { name: string }[]) =>
            row.filter((col: { name: string }) => !removedFields.includes(col.name))
          )
          .filter((row: { name: string }[]) => row.length > 0);

        const hasTitle = config.layouts.edit.some(
          (row: { name: string }[]) => row.some((col: { name: string }) => col.name === "title")
        );
        if (!hasTitle) {
          config.layouts.edit.unshift([{ name: "title", size: 6 }, { name: "order", size: 4 }]);
        }

        const reordered: any[] = [];
        for (const name of SERVICE_EDIT_ORDER) {
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

      if (uid === "api::privacy-page.privacy-page") {
        const reordered: any[] = [];
        for (const name of PRIVACY_EDIT_ORDER) {
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

      if (uid === "api::contact-page.contact-page") {
        const reordered: any[] = [];
        for (const name of CONTACT_EDIT_ORDER) {
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

      if (uid === "service.general") {
        delete config.metadatas.kicker;
      }

      if (uid === "service.help-section") {
        for (const removed of ["ctaText", "ctaButtonText", "ctaButtonLink"]) {
          delete config.metadatas[removed];
        }
      }

      if (COMPONENT_FIELD_LABELS[uid]) {
        for (const [field, meta] of Object.entries(COMPONENT_FIELD_LABELS[uid])) {
          if (config.metadatas[field]?.edit) {
            config.metadatas[field].edit.label = meta.label;
            if (meta.description) {
              config.metadatas[field].edit.description = meta.description;
            }
          }
          if (config.metadatas[field]?.list) {
            config.metadatas[field].list.label = meta.label;
          }
        }
      }
    }

    if (uid === "service.general" && config.layouts?.edit) {
      config.layouts.edit = config.layouts.edit
        .map((row: { name: string }[]) =>
          row.filter((col: { name: string }) => col.name !== "kicker")
        )
        .filter((row: { name: string }[]) => row.length > 0);
    }

    if (uid === "service.help-section" && config.layouts?.edit) {
      const removedFields = ["ctaText", "ctaButtonText", "ctaButtonLink"];
      config.layouts.edit = config.layouts.edit
        .map((row: { name: string }[]) =>
          row.filter((col: { name: string }) => !removedFields.includes(col.name))
        )
        .filter((row: { name: string }[]) => row.length > 0);
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
    serviceIcon: "search",
    activityIcons: ["target", "zap", "users", "search", "bar-chart-3", "file-check"],
    activities: [
      { title: "Felhasználói interjúk", description: "Strukturált interjúk készítése célcsoportokkal, hogy megértsük a valós motivációkat és akadályokat." },
      { title: "Használhatósági tesztelés", description: "Meglévő vagy tervezett felületek tesztelése valós felhasználókkal, hogy feltárjuk a problémás pontokat." },
      { title: "Perszóna készítés", description: "Adatokra épülő felhasználói perszónák létrehozása, amelyek a teljes csapat számára használhatók." },
      { title: "Versenytárs elemzés", description: "A piaci környezet és a versenytársak digitális megoldásainak áttekintése." },
      { title: "Felhasználói út térképezés", description: "User journey map-ek készítése, amelyek vizualizálják a felhasználói élmény egészét." },
      { title: "Adatelemzés", description: "Meglévő analitikai adatok értelmezése és összevetése a kvalitatív eredményekkel." },
    ],
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
    serviceIcon: "monitor",
    activityIcons: ["palette", "book-open", "monitor", "eye", "zap", "file-check"],
    activities: [
      { title: "Vizuális tervezés", description: "Pixel-pontos UI tervek készítése, amelyek tükrözik a márka identitását és a felhasználói elvárásokat." },
      { title: "Design rendszer építés", description: "Skálázható, konzisztens komponenskönyvtárak létrehozása, amelyek gyorsítják a fejlesztést." },
      { title: "Prototípus készítés", description: "Interaktív prototípusok, amelyekkel már a fejlesztés előtt tesztelhető a felhasználói élmény." },
      { title: "Reszponzív design", description: "Minden képernyőméretre optimalizált felületek, mobilon és desktopon egyaránt." },
      { title: "Motion design", description: "Célzott mikro-animációk és átmenetek, amelyek javítják a felhasználói élményt." },
      { title: "Fejlesztői átadás", description: "Részletes specifikáció és asset-készítés a zökkenőmentes implementációért." },
    ],
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
    serviceIcon: "eye",
    activityIcons: ["target", "file-check", "monitor", "eye", "users", "bar-chart-3"],
    activities: [
      { title: "Akadálymentesítési audit", description: "Meglévő weboldalak és alkalmazások átfogó WCAG 2.1 szabálynak megfelelő értékelése." },
      { title: "Javítási terv készítés", description: "Prioritizált, lépésről lépésre követhető javítási terv összeállítása a feltárt problémák alapján." },
      { title: "Asszisztív technológiás tesztelés", description: "Tesztelés képernyőolvasókkal, billentyűzetes navigációval és egyéb segédeszközökkel." },
      { title: "Akadálymentes design review", description: "Design fázisban végzett ellenőrzés, mielőtt a fejlesztés megkezdődne." },
      { title: "Csapat képzés", description: "Fejlesztők, tervezők és tartalomkészítők képzése az akadálymentes gyakorlatokról." },
      { title: "Folyamatos monitoring", description: "Rendszeres ellenőrzés és jelentéskészítés, hogy a megfelelés hosszú távon is megmaradjon." },
    ],
    processSteps: [
      { step: "01", title: "Helyzetértékelés", description: "A jelenlegi állapot felmérése automatizált és manuális eszközökkel, WCAG 2.1 szabvány szerint." },
      { step: "02", title: "Részletes audit", description: "Oldalról oldalra haladó, komponensszintű vizsgálat dokumentált eredményekkel." },
      { step: "03", title: "Javítási ütemterv", description: "Prioritizált feladatlista a kritikus, közepes és alacsony súlyosságú problémákra bontva." },
      { step: "04", title: "Implementációs támogatás", description: "A fejlesztő csapat támogatása a javítások során, kód review-kkal és konzultációval." },
      { step: "05", title: "Végső validáció", description: "A javítások utáni újratesztelés és a megfelelési nyilatkozat elkészítése." },
    ],
  },
];

const SERVICE_DEFINITION_SEED: Record<string, { heading: string; description: string }> = {
  "ux-kutatas": {
    heading: "Mi az a UX kutatás?",
    description:
      "A UX kutatás (felhasználói élmény kutatás) egy módszertan, amellyel feltárjuk, hogyan gondolkodnak, éreznek és viselkednek a felhasználók egy digitális termék használata közben. Interjúk, tesztek és adatelemzés segítségével valós bizonyítékokat gyűjtünk, hogy a termékfejlesztési döntések ne megérzéseken, hanem tényeken alapuljanak. Az eredmény: kevesebb felesleges fejlesztés, jobb felhasználói élmény és mérhető üzleti eredmények.",
  },
  "ui-design": {
    heading: "Mi az a UI design?",
    description:
      "A UI design (felhasználói felület tervezés) az a szakterület, amely a digitális termékek vizuális megjelenését és interakcióit alakítja ki — a színektől és tipográfiától a gombokon át a teljes képernyőtervekig. A jó UI nem csupán esztétika: érthetővé, használhatóvá és következetessé teszi a terméket, erősíti a márkát, és közvetlenül hozzájárul a konverzióhoz és a felhasználói elégedettséghez.",
  },
  "akadalymentesites": {
    heading: "Mi az a digitális akadálymentesítés?",
    description:
      "A digitális akadálymentesítés azt jelenti, hogy egy weboldal vagy alkalmazás mindenki számára használható — a látás-, hallás- vagy mozgássérült felhasználóknak, az idősebb korosztálynak és az átmeneti korlátozottsággal élőknek is. A nemzetközi WCAG szabvány alapján auditáljuk és javítjuk a felületeket, így a termék nemcsak a jogszabályi elvárásoknak felel meg, hanem szélesebb közönséget is elér.",
  },
};

async function backfillServiceDefinition(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "service_definition_v1" });
  if (done) {
    strapi.log.info("Service definition backfill: already completed (flag set) — skipping");
    return;
  }

  const services = await strapi.documents("api::service.service").findMany({
    populate: ["general", "definitionSection"],
  });

  if (services.length === 0) {
    strapi.log.info("Service definition backfill: no services found — will retry on next restart");
    return;
  }

  let errors = 0;
  for (const svc of services) {
    const slug = svc.general?.slug || "";
    const seed = SERVICE_DEFINITION_SEED[slug];
    if (!seed) {
      strapi.log.info(`Service definition backfill: no seed data for "${slug}" — skipping`);
      continue;
    }
    if (svc.definitionSection?.heading || svc.definitionSection?.description) {
      strapi.log.info(`Service definition backfill: "${slug}" already has definition — skipping`);
      continue;
    }
    try {
      await strapi.documents("api::service.service").update({
        documentId: svc.documentId,
        data: {
          definitionSection: {
            kicker: "Definíció",
            heading: seed.heading,
            description: seed.description,
          },
        },
      });
      await strapi.documents("api::service.service").publish({
        documentId: svc.documentId,
      });
      strapi.log.info(`Service definition backfill: filled definition for "${slug}"`);
    } catch (err: any) {
      errors++;
      strapi.log.error(`Service definition backfill: failed for "${slug}": ${err.message}`);
    }
  }

  const postCheck = await strapi.documents("api::service.service").findMany({
    populate: ["general", "definitionSection"],
  });
  const stillMissing = postCheck.filter(
    (s: any) =>
      SERVICE_DEFINITION_SEED[s.general?.slug || ""] &&
      !s.definitionSection?.heading &&
      !s.definitionSection?.description,
  );

  if (errors > 0 || stillMissing.length > 0) {
    strapi.log.warn(
      `Service definition backfill: incomplete (${errors} error(s), ${stillMissing.length} missing) — flag not set, will retry on next restart`,
    );
    return;
  }

  await store.set({ key: "service_definition_v1", value: true });
  strapi.log.info("Service definition backfill: completed successfully");
}

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

const SERVICE_RESTRUCTURE_SEED: Record<string, any> = {
  "ux-kutatas": {
    questionsIntro: {
      kicker: "A kihívásaid",
      heading: "Milyen kérdésekre segítünk választ találni?",
      description: "Ha ezek a kérdések ismerősek, a UX kutatás segít megalapozott döntéseket hozni.",
    },
    questions: [
      { title: "„Miért nem használják a felhasználók a terméket úgy, ahogy vártuk?”", description: "Feltárjuk a valós használati mintákat és a mögöttük álló okokat, hogy tudd, hol akad el a felhasználó." },
      { title: "„Melyik fejlesztésbe érdemes befektetni?”", description: "A kutatási eredmények alapján priorizálható, mi hoz valódi értéket a felhasználóknak és az üzletnek." },
      { title: "„Kik a valódi felhasználóink és mit akarnak?”", description: "Adatokra épülő perszónákkal és interjúkkal pontos képet adunk a célcsoportjaidról." },
      { title: "„Miért alacsony a konverzió?”", description: "Használhatósági teszteléssel azonosítjuk azokat a pontokat, ahol a felhasználók elakadnak vagy kilépnek." },
    ],
    helpIntro: {
      kicker: "Szakértelem",
      heading: "Miben tudunk segíteni?",
      description: "A felhasználói kutatás teljes eszköztárával dolgozunk — a tervezéstől az akcióképes javaslatokig.",
    },
    helpCta: {
      text: "Nem tudod, melyik módszer illik a helyzetedhez? Segítünk kiválasztani.",
      buttonText: "Kérj konzultációt",
      buttonLink: "/kapcsolat",
    },
    processIntro: {
      kicker: "A folyamat",
      heading: "Hogyan dolgozunk?",
      description: "Átlátható, lépésről lépésre haladó kutatási folyamat, amelynek minden fázisában látod, hol tartunk.",
    },
    deliverablesIntro: {
      kicker: "Kézzelfogható eredmény",
      heading: "Amit a projektből kapsz",
      description: "A kutatás végén nem csak elemzést kapsz, hanem konkrét, azonnal használható anyagokat.",
    },
    deliverablesVariant: "smallCards",
    deliverablesSmall: [
      { icon: "file-check", title: "Kutatási riport", description: "Részletes, mégis áttekinthető összefoglaló a legfontosabb megállapításokkal." },
      { icon: "users", title: "Perszónák", description: "Adatokra épülő felhasználói profilok, amelyeket a teljes csapat használhat." },
      { icon: "target", title: "Priorizált javaslatlista", description: "Konkrét, hatás szerint rangsorolt fejlesztési javaslatok." },
      { icon: "bar-chart-3", title: "Adatelemzési összefoglaló", description: "A kvantitatív adatok értelmezése és összevetése a kvalitatív eredményekkel." },
      { icon: "eye", title: "Használhatósági jegyzőkönyv", description: "A tesztek dokumentált eredményei, videórészletekkel és idézetekkel." },
      { icon: "zap", title: "Vezetői összefoglaló", description: "Döntéshozóknak szánt tömör kivonat a legfontosabb tanulságokkal." },
    ],
    deliverablesLarge: [
      { icon: "search", title: "Kutatási eredmények", description: "Minden, amit a felhasználóidról megtudtunk, rendszerezve.", bullets: ["Kutatási riport", "Interjú-összefoglalók", "Videórészletek"] },
      { icon: "users", title: "Felhasználói modellek", description: "A célcsoport megértését segítő eszközök.", bullets: ["Perszónák", "Felhasználói út térképek", "Fájdalompont-lista"] },
      { icon: "target", title: "Akcióterv", description: "Konkrét lépések a továbblépéshez.", bullets: ["Priorizált javaslatok", "Quick win lista", "Vezetői összefoglaló"] },
    ],
    faqIntro: {
      kicker: "Gyakori kérdések",
      heading: "Amit érdemes tisztázni a kutatás előtt",
      description: "Összegyűjtöttük a leggyakrabban felmerülő kérdéseket — ha másra is kíváncsi vagy, keress minket bátran.",
    },
    faq: [
      { question: "Mikor érdemes UX kutatást végezni?", answer: "Ideális esetben még a fejlesztés előtt, de meglévő termék esetén is bármikor értékes — például átalakítás, bővítés vagy alacsony konverzió esetén." },
      { question: "Mennyi ideig tart egy kutatási projekt?", answer: "A terjedelemtől függően jellemzően 3–8 hét. Egy fókuszált használhatósági teszt gyorsabb, egy átfogó feltáró kutatás hosszabb." },
      { question: "Hány felhasználóra van szükség?", answer: "Kvalitatív kutatásnál már 5–8 résztvevő is feltárja a problémák többségét. A pontos számot a kutatási célok határozzák meg." },
      { question: "Mennyi ideig tart egy UX kutatási projekt?", answer: "A legtöbb projekt 3–8 hét alatt lezajlik, a módszertantól és a résztvevők számától függően." },
      { question: "Online is működik a kutatás?", answer: "Igen — az interjúk és tesztek többsége távolról is elvégezhető, ami gyorsabb és költséghatékonyabb is lehet." },
      { question: "Mit kezdjünk az eredményekkel?", answer: "Minden kutatást priorizált, akcióképes javaslatokkal zárunk, és igény esetén a megvalósításban is támogatunk." },
    ],
    projectExamplesIntro: {
      kicker: "Referenciák",
      heading: "Kiemelt projektek",
      description: "Néhány projekt, ahol a kutatás kézzelfogható üzleti eredményt hozott.",
    },
    relatedIntro: {
      kicker: "További szolgáltatások",
      heading: "Kapcsolódó szolgáltatások",
      description: "A kutatás önmagában is értékes, de más szolgáltatásainkkal együtt fejti ki a legnagyobb hatást.",
    },
    relatedProjectSlugs: ["banki-applikacio", "logisztikai-szoftver"],
  },
  "ui-design": {
    questionsIntro: {
      kicker: "A kihívásaid",
      heading: "Milyen kérdésekre segítünk választ találni?",
      description: "Ha ezek a kérdések foglalkoztatnak, a tudatos felülettervezés a megoldás.",
    },
    questions: [
      { title: "„Miért tűnik elavultnak a felületünk?”", description: "Friss, a márkádhoz illő vizuális rendszert alakítunk ki, amely bizalmat épít." },
      { title: "„Miért nem konzisztens a termékünk kinézete?”", description: "Design rendszerrel biztosítjuk, hogy minden képernyő egységes és karbantartható legyen." },
      { title: "„Hogyan lehetne magasabb a konverziónk?”", description: "A felhasználói útvonalak áttervezésével több látogatóból lesz ügyfél." },
      { title: "„Hogyan gyorsítható a fejlesztés?”", description: "A komponensalapú tervezés csökkenti a fejlesztési időt és a félreértéseket." },
    ],
    helpIntro: {
      kicker: "Szakértelem",
      heading: "Miben tudunk segíteni?",
      description: "A vizuális iránytól a fejlesztői átadásig a felülettervezés minden fázisát lefedjük.",
    },
    helpCta: {
      text: "Csak egy részterületen kell segítség? Rugalmasan alkalmazkodunk.",
      buttonText: "Beszéljük meg",
      buttonLink: "/kapcsolat",
    },
    processIntro: {
      kicker: "A folyamat",
      heading: "Hogyan dolgozunk?",
      description: "Iteratív tervezési folyamat, ahol minden lépésnél véleményezheted és alakíthatod az irányt.",
    },
    deliverablesIntro: {
      kicker: "Kézzelfogható eredmény",
      heading: "Amit a projektből kapsz",
      description: "A projekt végén minden anyagot átadunk, rendezetten és fejlesztésre készen.",
    },
    deliverablesVariant: "largeCards",
    deliverablesSmall: [
      { icon: "palette", title: "UI tervek", description: "Pixel-pontos, minden képernyőméretre optimalizált felületi tervek." },
      { icon: "book-open", title: "Design rendszer", description: "Dokumentált komponenskönyvtár, amely gyorsítja a fejlesztést." },
      { icon: "monitor", title: "Interaktív prototípus", description: "Kattintható prototípus, amellyel a fejlesztés előtt tesztelhető az élmény." },
      { icon: "zap", title: "Mikro-animációk", description: "Motion design specifikáció az átmenetekhez és visszajelzésekhez." },
      { icon: "file-check", title: "Fejlesztői specifikáció", description: "Részletes átadási dokumentáció a zökkenőmentes implementációhoz." },
      { icon: "target", title: "Asset csomag", description: "Exportált ikonok, képek és grafikai elemek, fejlesztésre készen." },
    ],
    deliverablesLarge: [
      { icon: "palette", title: "Kész UI tervek", description: "A teljes termék végleges vizuális terve.", bullets: ["Minden képernyő terve", "Reszponzív változatok", "Sötét/világos mód (igény szerint)"] },
      { icon: "book-open", title: "Design rendszer", description: "Skálázható alap a további fejlesztéshez.", bullets: ["Komponenskönyvtár", "Stílus-útmutató", "Használati dokumentáció"] },
      { icon: "monitor", title: "Prototípus és átadás", description: "Minden, ami a megvalósításhoz kell.", bullets: ["Interaktív prototípus", "Fejlesztői specifikáció", "Exportált assetek"] },
    ],
    faqIntro: {
      kicker: "Gyakori kérdések",
      heading: "Amit érdemes tisztázni a tervezés előtt",
      description: "A leggyakrabban felmerülő kérdések — ha más is érdekel, keress minket bátran.",
    },
    faq: [
      { question: "Kell kész arculat a UI tervezéshez?", answer: "Nem feltétlenül — meglévő arculatra is építünk, de a vizuális irány kialakításában is tudunk segíteni." },
      { question: "Mennyi ideig tart egy UI design projekt?", answer: "Egy kisebb termék 4–6 hét, egy összetettebb alkalmazás 2–4 hónap — a pontos ütemtervet az elején rögzítjük." },
      { question: "Figma-ban dolgoztok?", answer: "Igen, elsősorban Figma-t használunk, így a tervek könnyen megoszthatók és a fejlesztők számára is jól használhatók." },
      { question: "A fejlesztést is vállaljátok?", answer: "A tervek implementálásában partnereinkkel együttműködve tudunk támogatni, és a fejlesztés alatt is elérhetők maradunk." },
      { question: "Mi történik, ha később új képernyők kellenek?", answer: "A design rendszer pontosan ezt szolgálja: az új felületek gyorsan, konzisztensen bővíthetők." },
    ],
    projectExamplesIntro: {
      kicker: "Portfólió",
      heading: "Projektpéldák",
      description: "Néhány felület, amelyet mi terveztünk.",
    },
    relatedIntro: {
      kicker: "További szolgáltatások",
      heading: "Kapcsolódó szolgáltatások",
      description: "A UI design más szolgáltatásainkkal kombinálva hozza a legjobb eredményt.",
    },
    relatedProjectSlugs: ["banki-applikacio", "logisztikai-szoftver"],
  },
  "akadalymentesites": {
    questionsIntro: {
      kicker: "A kihívásaid",
      heading: "Milyen kérdésekre segítünk választ találni?",
      description: "Ha ezek a kérdések felmerültek nálatok, az akadálymentesítés nem várhat tovább.",
    },
    questions: [
      { title: "„Megfelel a weboldalunk a jogszabályoknak?”", description: "Auditunk pontos képet ad arról, hol álltok az EU-s akadálymentesítési előírásokhoz képest." },
      { title: "„Kiket veszítünk el a jelenlegi felülettel?”", description: "Feltárjuk, mely felhasználói csoportok ütköznek akadályokba, és mekkora ez a kör." },
      { title: "„Mennyi munka lenne a megfelelés?”", description: "Priorizált javítási tervvel megmutatjuk, mit érdemes először és mit később javítani." },
      { title: "„Hogyan előzhetők meg az újabb hibák?”", description: "Képzéssel és folyamatba épített ellenőrzéssel a csapat hosszú távon is akadálymentes terméket készít." },
    ],
    helpIntro: {
      kicker: "Szakértelem",
      heading: "Miben tudunk segíteni?",
      description: "Az auditálástól a csapatképzésig az akadálymentesítés teljes folyamatát lefedjük.",
    },
    helpCta: {
      text: "Nem tudod, hol kezdjétek? Egy gyors állapotfelméréssel segítünk tisztán látni.",
      buttonText: "Kérj állapotfelmérést",
      buttonLink: "/kapcsolat",
    },
    processIntro: {
      kicker: "A folyamat",
      heading: "Hogyan dolgozunk?",
      description: "Szabványokra épülő, dokumentált folyamat — az első felméréstől a megfelelési nyilatkozatig.",
    },
    deliverablesIntro: {
      kicker: "Kézzelfogható eredmény",
      heading: "Amit a projektből kapsz",
      description: "Minden szakaszban dokumentált, ellenőrizhető eredményeket adunk át.",
    },
    deliverablesVariant: "smallCards",
    deliverablesSmall: [
      { icon: "file-check", title: "Audit riport", description: "Részletes, WCAG 2.1 szerinti hibalista súlyosság szerint rendezve." },
      { icon: "target", title: "Javítási ütemterv", description: "Priorizált feladatlista, amely mentén a csapat haladni tud." },
      { icon: "shield", title: "Megfelelési nyilatkozat", description: "A javítások utáni validáció és a hivatalos nyilatkozat elkészítése." },
      { icon: "users", title: "Csapatképzési anyagok", description: "Gyakorlati útmutatók fejlesztőknek, tervezőknek és tartalomkészítőknek." },
      { icon: "eye", title: "Tesztelési jegyzőkönyv", description: "Képernyőolvasós és billentyűzetes tesztek dokumentált eredményei." },
      { icon: "bar-chart-3", title: "Monitoring riportok", description: "Rendszeres ellenőrzési jelentések a tartós megfelelésért." },
    ],
    deliverablesLarge: [
      { icon: "file-check", title: "Audit csomag", description: "A teljes állapotfelmérés eredményei.", bullets: ["WCAG 2.1 hibalista", "Súlyossági besorolás", "Képernyőképes dokumentáció"] },
      { icon: "target", title: "Javítási terv", description: "Világos útiterv a megfeleléshez.", bullets: ["Priorizált feladatlista", "Becsült ráfordítások", "Quick win javaslatok"] },
      { icon: "shield", title: "Megfelelés és fenntartás", description: "Hosszú távú biztonság.", bullets: ["Megfelelési nyilatkozat", "Csapatképzés", "Monitoring terv"] },
    ],
    faqIntro: {
      kicker: "Gyakori kérdések",
      heading: "Amit érdemes tisztázni az audit előtt",
      description: "A leggyakoribb kérdések az akadálymentesítésről — ha más is érdekel, keress minket.",
    },
    faq: [
      { question: "Kötelező az akadálymentesítés?", answer: "Az EU Akadálymentesítési irányelve alapján egyre több szervezet számára igen — 2025-től a legtöbb online szolgáltatásra is vonatkozik." },
      { question: "Mennyi ideig tart egy audit?", answer: "Egy átlagos weboldal auditja 2–4 hét, az oldal méretétől és összetettségétől függően." },
      { question: "A javításokat is elvégzitek?", answer: "A javítási terv alapján a fejlesztőcsapatot támogatjuk kód review-kkal és konzultációval, illetve partnereinkkel a kivitelezésben is segítünk." },
      { question: "Elég egy automatikus ellenőrzés?", answer: "Nem — az automatizált eszközök a problémák kb. 30–40%-át találják meg. A teljes képhez manuális és asszisztív technológiás tesztelés is szükséges." },
      { question: "Mi történik az audit után?", answer: "Priorizált javítási tervet adunk át, majd a javítások után újratesztelünk és megfelelési nyilatkozatot készítünk." },
    ],
    projectExamplesIntro: {
      kicker: "Referenciák",
      heading: "Projektpéldák",
      description: "Projektek, ahol az akadálymentesítés valódi üzleti értéket hozott.",
    },
    relatedIntro: {
      kicker: "További szolgáltatások",
      heading: "Kapcsolódó szolgáltatások",
      description: "Az akadálymentesítés a tervezéssel és kutatással együtt a leghatékonyabb.",
    },
    relatedProjectSlugs: ["e-kereskedelmi-akadalymentesites"],
  },
};

async function backfillServiceRestructure(strapi: any) {
  const path = require("path");
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "service_restructure_v2" });
  if (done) {
    strapi.log.info("Service restructure backfill: already completed (flag set) — skipping");
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
    populate: [
      "general",
      "general.icon",
      "general.heroImage",
      "questionsSection",
      "helpSection",
      "processSection",
      "deliverablesSection",
      "projectExamplesIntro",
      "faqSection",
      "relatedServicesIntro",
      "relatedServices",
      "relatedProjects",
    ],
  });

  if (services.length === 0) {
    strapi.log.info("Service restructure backfill: no services found — will retry on next restart");
    return;
  }

  const projects = await strapi.documents("api::project.project").findMany({
    pagination: { pageSize: 200 },
  });

  let incomplete = 0;
  for (const svc of services) {
    const svcSlug = svc.general?.slug || "";
    const seed = SERVICE_RESTRUCTURE_SEED[svcSlug];
    const oldSeed = SERVICE_SEED_DATA.find((s) => s.slug === svcSlug);
    if (!seed) {
      strapi.log.info(`Service restructure backfill: no seed data for "${svcSlug}" — skipping`);
      continue;
    }

    const data: Record<string, any> = {};

    const generalIconId =
      svc.general?.icon?.id ||
      (oldSeed?.serviceIcon ? await getIconId(oldSeed.serviceIcon) : null);
    if (svc.general && !svc.general.icon && generalIconId) {
      data.general = {
        ...svc.general,
        icon: generalIconId || undefined,
        heroImage: svc.general.heroImage?.id || undefined,
      };
    }

    if (!svc.questionsSection) {
      data.questionsSection = {
        intro: seed.questionsIntro,
        cards: seed.questions,
      };
    }

    if (!svc.helpSection) {
      const sourceCards = await Promise.all(
        (oldSeed?.activities || []).map(async (a: any, i: number) => ({
          title: a.title,
          description: a.description,
          icon:
            (await getIconId(
              (oldSeed?.activityIcons || [])[i % (oldSeed?.activityIcons?.length || 1)] ||
                "check-circle-2",
            )) || undefined,
        })),
      );
      data.helpSection = {
        intro: seed.helpIntro,
        cards: sourceCards,
        ctaText: seed.helpCta.text,
        ctaButtonText: seed.helpCta.buttonText,
        ctaButtonLink: seed.helpCta.buttonLink,
      };
    }

    if (!svc.processSection) {
      data.processSection = {
        intro: seed.processIntro,
        steps: (oldSeed?.processSteps || []).map((ps: any) => ({
          title: ps.title,
          description: ps.description,
        })),
      };
    }

    if (!svc.deliverablesSection) {
      const smallCards = [];
      for (const item of seed.deliverablesSmall) {
        smallCards.push({
          title: item.title,
          description: item.description,
          icon: (await getIconId(item.icon)) || undefined,
        });
      }
      const largeCards = [];
      for (const item of seed.deliverablesLarge) {
        largeCards.push({
          title: item.title,
          description: item.description,
          icon: (await getIconId(item.icon)) || undefined,
          bullets: item.bullets.map((text: string) => ({ text })),
        });
      }
      data.deliverablesSection = {
        intro: seed.deliverablesIntro,
        variant: seed.deliverablesVariant,
        smallCards,
        largeCards,
      };
    }

    if (!svc.projectExamplesIntro) {
      data.projectExamplesIntro = seed.projectExamplesIntro;
    }

    if (!svc.faqSection) {
      data.faqSection = {
        intro: seed.faqIntro,
        items: seed.faq,
      };
    }

    if (!svc.relatedServicesIntro) {
      data.relatedServicesIntro = seed.relatedIntro;
    }

    if ((svc.relatedServices || []).length === 0) {
      const others = services.filter((s: any) => s.documentId !== svc.documentId);
      if (others.length > 0) {
        data.relatedServices = others.map((s: any) => s.documentId);
      }
    }

    if ((svc.relatedProjects || []).length === 0 && projects.length > 0) {
      const preferred = (seed.relatedProjectSlugs || [])
        .map((slug: string) => projects.find((p: any) => p.slug === slug))
        .filter(Boolean);
      const chosen = preferred.length > 0 ? preferred : projects.slice(0, 2);
      data.relatedProjects = chosen.map((p: any) => p.documentId);
    }

    if (Object.keys(data).length === 0) {
      strapi.log.info(`Service restructure backfill: "${svcSlug}" already complete — skipping`);
      continue;
    }

    try {
      await strapi.documents("api::service.service").update({
        documentId: svc.documentId,
        data,
      });
      await strapi.documents("api::service.service").publish({
        documentId: svc.documentId,
      });
      strapi.log.info(
        `Service restructure backfill: filled [${Object.keys(data).join(", ")}] for "${svcSlug}"`,
      );
    } catch (err: any) {
      incomplete++;
      strapi.log.error(
        `Service restructure backfill: failed for "${svcSlug}": ${err.message}`,
      );
    }
  }

  const postCheck = await strapi.documents("api::service.service").findMany({
    populate: [
      "general",
      "questionsSection",
      "helpSection",
      "processSection",
      "deliverablesSection",
      "projectExamplesIntro",
      "faqSection",
      "relatedServicesIntro",
      "relatedServices",
      "relatedProjects",
    ],
  });
  const stillMissing = postCheck.filter(
    (s: any) =>
      SERVICE_RESTRUCTURE_SEED[s.general?.slug || ""] &&
      (!s.questionsSection ||
        !s.helpSection ||
        !s.processSection ||
        !s.deliverablesSection ||
        !s.projectExamplesIntro ||
        !s.faqSection ||
        !s.relatedServicesIntro ||
        (s.relatedServices || []).length === 0 ||
        (s.relatedProjects || []).length === 0),
  );

  if (incomplete > 0 || stillMissing.length > 0) {
    strapi.log.warn(
      `Service restructure backfill: incomplete (${incomplete} error(s), ${stillMissing.length} missing) — flag not set, will retry on next restart`,
    );
    return;
  }

  await store.set({ key: "service_restructure_v2", value: true });
  strapi.log.info("Service restructure backfill: completed successfully");
}

const FEATURED_PROJECT_SLUGS = [
  "banki-applikacio",
  "logisztikai-szoftver",
  "e-kereskedelmi-akadalymentesites",
];

async function backfillFeaturedProjects(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "featured_projects_backfill_v1" });
  if (done) {
    strapi.log.info("Featured projects backfill: already completed (flag set) — skipping");
    return;
  }

  const projects = await strapi.documents("api::project.project").findMany({
    pagination: { pageSize: 200 },
  });

  if (!projects || projects.length === 0) {
    strapi.log.info("Featured projects backfill: no projects found — will retry on next restart");
    return;
  }

  let updated = 0;
  for (const slug of FEATURED_PROJECT_SLUGS) {
    const project = projects.find((p: any) => p.slug === slug);
    if (!project) {
      strapi.log.warn(`Featured projects backfill: project "${slug}" not found — skipping`);
      continue;
    }
    if (project.featured === true) {
      strapi.log.info(`Featured projects backfill: "${slug}" already featured — skipping`);
      continue;
    }
    await strapi.documents("api::project.project").update({
      documentId: project.documentId,
      data: { featured: true },
    });
    await strapi.documents("api::project.project").publish({
      documentId: project.documentId,
    });
    updated++;
    strapi.log.info(`Featured projects backfill: marked "${slug}" as featured`);
  }

  await store.set({ key: "featured_projects_backfill_v1", value: true });
  strapi.log.info(`Featured projects backfill: completed (${updated} project(s) updated)`);
}

async function backfillFeaturedBlogPosts(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "featured_blog_posts_backfill_v1" });
  if (done) {
    strapi.log.info("Featured blog posts backfill: already completed (flag set) — skipping");
    return;
  }

  // Only consider PUBLISHED posts — the backfill must never surface or promote draft content.
  const posts = await strapi.documents("api::blog-post.blog-post").findMany({
    status: "published",
    pagination: { pageSize: 200 },
    sort: { date: "desc" },
  });

  if (!posts || posts.length === 0) {
    strapi.log.info("Featured blog posts backfill: no published blog posts found — will retry on next restart");
    return;
  }

  const newest = posts.slice(0, 3);
  const newestIds = new Set(newest.map((p: any) => p.documentId));
  const featuredOutsideNewest = posts.some(
    (p: any) => p.featured === true && !newestIds.has(p.documentId),
  );
  if (featuredOutsideNewest) {
    // An admin already made their own featured selection — respect it.
    strapi.log.info("Featured blog posts backfill: featured posts already exist — nothing to do");
    await store.set({ key: "featured_blog_posts_backfill_v1", value: true });
    return;
  }
  if (newest.every((p: any) => p.featured === true)) {
    strapi.log.info("Featured blog posts backfill: newest posts already featured — nothing to do");
    await store.set({ key: "featured_blog_posts_backfill_v1", value: true });
    return;
  }

  let updated = 0;
  let errors = 0;
  for (let i = 0; i < newest.length; i++) {
    const post = newest[i];
    if (post.featured === true) {
      // Already handled by a previous (partially failed) run — skip, keep resume idempotent.
      continue;
    }
    try {
      // Set the flags at the DB layer on both the draft and published rows of this document.
      // This avoids documents().update()+publish(), which would promote any pending draft
      // edits (or an unpublished draft) to the live site.
      await strapi.db.query("api::blog-post.blog-post").updateMany({
        where: { documentId: post.documentId },
        data: { featured: true, order: i + 1 },
      });
      updated++;
      strapi.log.info(`Featured blog posts backfill: marked "${post.slug}" as featured (order ${i + 1})`);
    } catch (err: any) {
      errors++;
      strapi.log.error(`Featured blog posts backfill: failed for "${post.slug}": ${err.message}`);
    }
  }

  if (errors > 0) {
    strapi.log.warn(
      `Featured blog posts backfill: incomplete (${errors} error(s)) — flag not set, will retry on next restart`,
    );
    return;
  }

  await store.set({ key: "featured_blog_posts_backfill_v1", value: true });
  strapi.log.info(`Featured blog posts backfill: completed (${updated} post(s) updated)`);
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

async function dropRemovedServiceFields(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "service_unused_fields_drop_v1" });
  if (done) {
    strapi.log.info("Unused service fields drop: already completed (flag set) — skipping");
    return;
  }

  const removedComponentTypes = [
    "service.value-proposition",
    "service.activity",
    "service.benefit",
    "service.tool",
  ];
  const removedTables = [
    "components_service_value_propositions",
    "components_service_activities",
    "components_service_benefits",
    "components_service_tools",
  ];

  try {
    const deleted = await knex("strapi.services_cmps")
      .whereIn("component_type", removedComponentTypes)
      .del();
    strapi.log.info(`Unused service fields drop: removed ${deleted} component link row(s)`);

    for (const table of removedTables) {
      await knex.raw(`DROP TABLE IF EXISTS strapi."${table}" CASCADE`);
    }
    strapi.log.info("Unused service fields drop: orphan component tables dropped");

    await knex.raw(`ALTER TABLE strapi.services DROP COLUMN IF EXISTS how_we_work`);
    strapi.log.info("Unused service fields drop: how_we_work column dropped");

    await store.set({ key: "service_unused_fields_drop_v1", value: true });
    strapi.log.info("Unused service fields drop: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Unused service fields drop: failed — will retry on next restart: ${err.message}`);
  }
}

async function dropUnusedAdminFields(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "unused_admin_fields_drop_v1" });
  if (done) {
    strapi.log.info("Unused admin fields drop: already completed (flag set) — skipping");
    return;
  }

  try {
    const clientsRows = await knex("strapi.homepages_cmps")
      .where("component_type", "homepage.clients-section")
      .del();
    strapi.log.info(`Unused admin fields drop: removed ${clientsRows} clients-section link row(s)`);

    const droppedTables = [
      "components_homepage_clients_sections",
      "blog_pages_cmps",
      "blog_pages",
      "projects_pages_cmps",
      "projects_pages",
    ];
    for (const table of droppedTables) {
      await knex.raw(`DROP TABLE IF EXISTS strapi."${table}" CASCADE`);
    }
    strapi.log.info("Unused admin fields drop: removed blog-page/projects-page/clients-section tables");

    await knex.raw(`ALTER TABLE strapi.about_pages DROP COLUMN IF EXISTS team_section_heading`);
    await knex.raw(`ALTER TABLE strapi.about_pages DROP COLUMN IF EXISTS gallery_section_heading`);
    await knex.raw(`ALTER TABLE strapi.clients DROP COLUMN IF EXISTS website`);
    await knex.raw(`ALTER TABLE strapi.global_settings DROP COLUMN IF EXISTS default_meta_title`);
    await knex.raw(`ALTER TABLE strapi.global_settings DROP COLUMN IF EXISTS default_meta_description`);
    strapi.log.info("Unused admin fields drop: unused columns dropped");

    await knex("strapi.files_related_mph")
      .where({ related_type: "about.intro", field: "image" })
      .del();
    strapi.log.info("Unused admin fields drop: about intro image links removed");

    await store.set({ key: "unused_admin_fields_drop_v1", value: true });
    strapi.log.info("Unused admin fields drop: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Unused admin fields drop: failed — will retry on next restart: ${err.message}`);
  }
}

async function dropServiceGeneralKicker(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "service_general_kicker_drop_v1" });
  if (done) {
    strapi.log.info("Service general kicker drop: already completed (flag set) — skipping");
    return;
  }

  try {
    await knex.raw(`ALTER TABLE strapi.components_service_generals DROP COLUMN IF EXISTS kicker`);
    strapi.log.info("Service general kicker drop: kicker column dropped");
    await store.set({ key: "service_general_kicker_drop_v1", value: true });
    strapi.log.info("Service general kicker drop: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Service general kicker drop: failed — will retry on next restart: ${err.message}`);
  }
}

async function dropHelpSectionCtaFields(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "help_section_cta_drop_v1" });
  if (done) {
    strapi.log.info("Help section CTA drop: already completed (flag set) — skipping");
    return;
  }

  try {
    await knex.raw(`ALTER TABLE strapi.components_service_help_sections DROP COLUMN IF EXISTS cta_text`);
    await knex.raw(`ALTER TABLE strapi.components_service_help_sections DROP COLUMN IF EXISTS cta_button_text`);
    await knex.raw(`ALTER TABLE strapi.components_service_help_sections DROP COLUMN IF EXISTS cta_button_link`);
    strapi.log.info("Help section CTA drop: unused CTA columns dropped");
    await store.set({ key: "help_section_cta_drop_v1", value: true });
    strapi.log.info("Help section CTA drop: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Help section CTA drop: failed — will retry on next restart: ${err.message}`);
  }
}

async function markCareerFormSubject(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "career_form_subject_flag_v1" });
  if (done) {
    strapi.log.info("Career form subject flag: already completed (flag set) — skipping");
    return;
  }

  try {
    await knex.raw(`
      UPDATE strapi.components_contact_form_subjects
      SET is_career = true
      WHERE is_career IS DISTINCT FROM true
        AND (LOWER(value) IN ('career', 'karrier') OR LOWER(label) = 'karrier')
    `);
    strapi.log.info("Career form subject flag: existing career subject(s) marked");
    await store.set({ key: "career_form_subject_flag_v1", value: true });
    strapi.log.info("Career form subject flag: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Career form subject flag: failed — will retry on next restart: ${err.message}`);
  }
}

const PRIVACY_SEED_HEADING = "Adatkezelési tájékoztató";
const PRIVACY_SEED_BODY = `Ez az adatkezelési tájékoztató ismerteti, hogy a Works. (a továbbiakban: Adatkezelő) hogyan kezeli a weboldal látogatóinak és a velünk kapcsolatba lépő személyeknek a személyes adatait.

## 1. Az adatkezelő adatai

- **Név:** Works.
- **Székhely:** 1054 Budapest, Szabadság tér 7.
- **E-mail:** hello@works.hu

## 2. A kezelt adatok köre

A kapcsolatfelvételi űrlap kitöltésekor a következő adatokat kezeljük: név, e-mail cím, az üzenet tárgya és tartalma. Álláspályázat esetén a pályázathoz csatolt önéletrajz és a benne szereplő adatok is ide tartoznak.

## 3. Az adatkezelés célja és jogalapja

Az adatkezelés célja a megkeresések megválaszolása, illetve álláspályázat esetén a kiválasztási folyamat lebonyolítása. Az adatkezelés jogalapja az érintett hozzájárulása (GDPR 6. cikk (1) bekezdés a) pont).

## 4. Az adatkezelés időtartama

A megkeresésekhez kapcsolódó adatokat a cél megvalósulásáig, álláspályázatok esetén — külön hozzájárulás alapján — legfeljebb 1 évig őrizzük meg.

## 5. Az érintettek jogai

Bármikor kérhet tájékoztatást személyes adatai kezeléséről, kérheti azok helyesbítését, törlését vagy kezelésének korlátozását, valamint visszavonhatja hozzájárulását a hello@works.hu címen. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhat.

*Ez a tájékoztató sablon jellegű kiinduló szöveg — kérjük, a végleges, jogilag ellenőrzött tartalommal frissítse.*`;

async function seedPrivacyPage(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "privacy_page_seed_v1" });
  if (done) {
    strapi.log.info("Privacy page seed: already completed (flag set) — skipping");
    return;
  }

  try {
    const docs = strapi.documents("api::privacy-page.privacy-page");
    let existing = await docs.findFirst({});
    if (!existing) {
      existing = await docs.create({
        data: { heading: PRIVACY_SEED_HEADING, body: PRIVACY_SEED_BODY },
      });
      strapi.log.info("Privacy page seed: default content created");
    } else {
      strapi.log.info("Privacy page seed: content already exists — not overwriting");
    }
    // Publish separately and re-entrantly: if a previous run created the draft
    // but crashed before publishing, this retry still publishes it.
    const published = await docs.findFirst({ status: "published" });
    if (!published) {
      await docs.publish({ documentId: existing.documentId });
      strapi.log.info("Privacy page seed: content published");
    }
    await store.set({ key: "privacy_page_seed_v1", value: true });
    strapi.log.info("Privacy page seed: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Privacy page seed: failed — will retry on next restart: ${err.message}`);
  }
}

async function seedServiceCtaBanners(strapi: any) {
  const knex = strapi.db.connection;
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "service_cta_banner_seed_v1" });
  if (done) {
    strapi.log.info("Service CTA banner seed: already completed (flag set) — skipping");
    return;
  }

  try {
    const services = await knex("strapi.services").select("id");
    const linked = await knex("strapi.services_cmps")
      .where({ field: "ctaBanner" })
      .pluck("entity_id");
    const missing = services.filter((s: any) => !linked.includes(s.id));

    for (const svc of missing) {
      const [banner] = await knex("strapi.components_homepage_cta_banners")
        .insert({
          heading: "Beszéljük meg, hogyan segíthetünk a projektedben.",
          cta_text: "Kérj konzultációt",
          cta_link: "/kapcsolat",
        })
        .returning("id");
      await knex("strapi.services_cmps").insert({
        entity_id: svc.id,
        cmp_id: banner.id ?? banner,
        component_type: "homepage.cta-banner",
        field: "ctaBanner",
        order: 1,
      });
    }
    strapi.log.info(`Service CTA banner seed: seeded ${missing.length} service(s)`);
    await store.set({ key: "service_cta_banner_seed_v1", value: true });
    strapi.log.info("Service CTA banner seed: completed successfully");
  } catch (err: any) {
    strapi.log.error(`Service CTA banner seed: failed — will retry on next restart: ${err.message}`);
  }
}

const GALLERY_SEED_IMAGES = [
  { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop", name: "works-moment-teamwork", alt: "Csapatmunka az irodában" },
  { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=900&fit=crop", name: "works-moment-workshop", alt: "Workshop megbeszélés" },
  { url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&h=900&fit=crop", name: "works-moment-meeting", alt: "Csapatmegbeszélés a tárgyalóban" },
  { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=900&fit=crop", name: "works-moment-collaboration", alt: "Közös munka a projekten" },
  { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=900&fit=crop", name: "works-moment-planning", alt: "Tervezés és egyeztetés" },
  { url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=900&fit=crop", name: "works-moment-presentation", alt: "Prezentáció a csapatnak" },
  { url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=900&fit=crop", name: "works-moment-brainstorm", alt: "Ötletelés a csapattal" },
  { url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=900&fit=crop", name: "works-moment-office", alt: "Irodai pillanat" },
];

async function uploadRemoteImage(
  strapi: any,
  url: string,
  fileName: string,
  alt: string,
  logPrefix: string,
): Promise<number | null> {
  const fs = require("fs");
  const os = require("os");
  const path = require("path");

  const existing = await strapi.db
    .query("plugin::upload.file")
    .findOne({ where: { name: fileName } });
  if (existing) return existing.id;

  const res = await fetch(url);
  if (!res.ok) {
    strapi.log.warn(`${logPrefix}: download failed for ${fileName} (${res.status})`);
    return null;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/png";
  const tmpPath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const uploaded = await strapi
      .plugin("upload")
      .service("upload")
      .upload({
        data: {
          fileInfo: { name: fileName, alternativeText: alt, caption: "" },
        },
        files: {
          filepath: tmpPath,
          originalFilename: fileName,
          mimetype: contentType.split(";")[0],
          size: buffer.length,
        },
      });
    return uploaded?.[0]?.id || null;
  } catch (err: any) {
    strapi.log.error(`${logPrefix}: upload failed for ${fileName}: ${err.message}`);
    return null;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}

// Creates DRAFT blog posts from scripts/squarespace-posts.json (generated by
// scripts/squarespace-extract.mjs from the Squarespace export). Never publishes
// anything. Idempotent: a post is skipped when its slug already exists in any
// version (draft or published), so editors' later changes are never overwritten.
async function migrateSquarespaceDrafts(strapi: any) {
  const fs = require("fs");
  const path = require("path");

  const jsonPath = path.resolve(process.cwd(), "scripts", "squarespace-posts.json");
  if (!fs.existsSync(jsonPath)) {
    return; // nothing staged for migration
  }

  let posts: any[];
  try {
    posts = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch (err: any) {
    strapi.log.error(`Squarespace migration: cannot parse ${jsonPath}: ${err.message}`);
    return;
  }
  if (!Array.isArray(posts) || posts.length === 0) return;

  for (const post of posts) {
    try {
      if (!post.slug || !post.title) continue;

      const existing = await strapi.db
        .query("api::blog-post.blog-post")
        .findOne({ where: { slug: post.slug } });
      if (existing) {
        continue; // already migrated (or an editor created it) — never touch it
      }

      // Hero / featured image
      let heroId: number | null = null;
      if (post.heroUrl) {
        heroId = await uploadRemoteImage(
          strapi,
          post.heroUrl,
          `sqsp-${post.slug}-hero${path.extname(new URL(post.heroUrl).pathname) || ".png"}`,
          post.title,
          "Squarespace migration",
        );
        if (!heroId) {
          strapi.log.warn(
            `Squarespace migration: "${post.slug}" skipped — hero image failed to download, will retry on next restart`,
          );
          continue; // don't create an incomplete draft; slug check allows retry
        }
      }

      // Content blocks
      const contentBlocks: any[] = [];
      let imgIdx = 0;
      let missingImages = 0;
      for (const block of post.blocks || []) {
        if (block.type === "text") {
          contentBlocks.push({ __component: "content.text-block", body: block.markdown });
        } else if (block.type === "highlight") {
          contentBlocks.push({ __component: "content.highlight-block", quote: block.markdown });
        } else if (block.type === "image") {
          imgIdx++;
          const ext = path.extname(new URL(block.url).pathname) || ".png";
          const imgId = await uploadRemoteImage(
            strapi,
            block.url,
            `sqsp-${post.slug}-${imgIdx}${ext}`,
            block.caption || "",
            "Squarespace migration",
          );
          if (imgId) {
            contentBlocks.push({
              __component: "content.image-block",
              image: imgId,
              caption: block.caption || "",
            });
          } else {
            missingImages++;
          }
        }
      }

      if (missingImages > 0) {
        strapi.log.warn(
          `Squarespace migration: "${post.slug}" skipped — ${missingImages} image(s) failed to download, will retry on next restart`,
        );
        continue; // don't create an incomplete draft; slug check allows retry
      }

      // documents().create() creates a DRAFT — nothing is published here.
      await strapi.documents("api::blog-post.blog-post").create({
        data: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt || "",
          date: post.date || null,
          readingTime: post.readingTime || "",
          image: heroId,
          contentBlocks,
        },
        status: "draft",
      });
      strapi.log.info(`Squarespace migration: created DRAFT "${post.slug}" (${contentBlocks.length} block(s))`);
    } catch (err: any) {
      strapi.log.error(`Squarespace migration: failed for "${post.slug}": ${err.message}`);
    }
  }
}

async function uploadGalleryImage(
  strapi: any,
  image: { url: string; name: string; alt: string },
): Promise<number | null> {
  const fs = require("fs");
  const os = require("os");
  const path = require("path");

  const fileName = `${image.name}.jpg`;
  const existing = await strapi.db
    .query("plugin::upload.file")
    .findOne({ where: { name: fileName } });
  if (existing) return existing.id;

  const res = await fetch(image.url);
  if (!res.ok) {
    strapi.log.warn(`Gallery seed: download failed for ${image.name} (${res.status})`);
    return null;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const uploaded = await strapi
      .plugin("upload")
      .service("upload")
      .upload({
        data: {
          fileInfo: { name: fileName, alternativeText: image.alt, caption: image.alt },
        },
        files: {
          filepath: tmpPath,
          originalFilename: fileName,
          mimetype: "image/jpeg",
          size: buffer.length,
        },
      });
    return uploaded?.[0]?.id || null;
  } catch (err: any) {
    strapi.log.error(`Gallery seed: upload failed for ${image.name}: ${err.stack || err.message}`);
    return null;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }
}

async function seedAboutGalleryImages(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const done = await store.get({ key: "about_gallery_images_seed_v1" });
  if (done) {
    strapi.log.info("Gallery seed: already completed (flag set) — skipping");
    return;
  }

  try {
    const docs = strapi.documents("api::about-page.about-page");
    const draft = await docs.findFirst({ populate: ["galleryImages"] });
    const published = await docs.findFirst({ status: "published", populate: ["galleryImages"] });

    if (!draft && !published) {
      strapi.log.info("Gallery seed: no about-page entry found — skipping");
      return;
    }

    // Strict guard: never touch a gallery that already has images in EITHER
    // the draft or the published version (e.g. production, where real photos
    // were uploaded by editors).
    const hasImages = (doc: any) =>
      Array.isArray(doc?.galleryImages) && doc.galleryImages.length > 0;
    if (hasImages(draft) || hasImages(published)) {
      strapi.log.info("Gallery seed: gallery already has images — not overwriting");
      await store.set({ key: "about_gallery_images_seed_v1", value: true });
      return;
    }

    const ids: number[] = [];
    for (const image of GALLERY_SEED_IMAGES) {
      const id = await uploadGalleryImage(strapi, image);
      if (id) ids.push(id);
    }

    if (ids.length < GALLERY_SEED_IMAGES.length) {
      strapi.log.warn(
        `Gallery seed: only ${ids.length}/${GALLERY_SEED_IMAGES.length} image(s) available — will retry on next restart`,
      );
      return;
    }

    const existing = published || draft;

    await docs.update({
      documentId: existing.documentId,
      data: { galleryImages: ids },
      status: "published",
    });

    await store.set({ key: "about_gallery_images_seed_v1", value: true });
    strapi.log.info(`Gallery seed: completed successfully with ${ids.length} image(s)`);
  } catch (err: any) {
    strapi.log.error(`Gallery seed: failed — will retry on next restart: ${err.message}`);
  }
}

export default {
  register({ strapi }) {
    registerWebsiteRebuildAdminRoutes(strapi);
    registerCvUploadRoutes(strapi);
  },
  async bootstrap({ strapi }) {
    await resetAdminFromEnv(strapi);
    await updateAllLabels(strapi);
    await ensurePublicPermissions(strapi);
    setupWebsiteAutoRebuild(strapi);

    const httpServer = strapi.server?.httpServer;
    if (httpServer) {
      httpServer.once("listening", () => {
        migrateSlugToGeneral(strapi)
          .then(() => syncServiceTitles(strapi))
          .then(() => backfillServiceRestructure(strapi))
          .then(() => backfillServiceDefinition(strapi))
          .then(() => backfillFeaturedProjects(strapi))
          .then(() => backfillFeaturedBlogPosts(strapi))
          .then(() => dropRemovedServiceFields(strapi))
          .then(() => dropUnusedAdminFields(strapi))
          .then(() => dropServiceGeneralKicker(strapi))
          .then(() => dropHelpSectionCtaFields(strapi))
          .then(() => seedServiceCtaBanners(strapi))
          .then(() => markCareerFormSubject(strapi))
          .then(() => seedPrivacyPage(strapi))
          .then(() => seedAboutGalleryImages(strapi))
          .then(() => migrateSquarespaceDrafts(strapi))
          .then(() => strapi.log.info("Bootstrap tasks completed successfully"))
          .catch((err: any) => {
            strapi.log.error(`Bootstrap task failed: ${err.message}`);
            strapi.log.error(`Stack: ${err.stack}`);
          })
          .finally(() => markWebsiteAutoRebuildReady());
      });
    } else {
      await migrateSlugToGeneral(strapi);
      await syncServiceTitles(strapi);
      await backfillServiceRestructure(strapi);
      await backfillServiceDefinition(strapi);
      await backfillFeaturedProjects(strapi);
      await backfillFeaturedBlogPosts(strapi);
      await dropRemovedServiceFields(strapi);
      await dropUnusedAdminFields(strapi);
      await dropServiceGeneralKicker(strapi);
      await dropHelpSectionCtaFields(strapi);
      await seedServiceCtaBanners(strapi);
      await markCareerFormSubject(strapi);
      await seedPrivacyPage(strapi);
      await seedAboutGalleryImages(strapi);
      await migrateSquarespaceDrafts(strapi);
      strapi.log.info("Bootstrap tasks completed successfully");
      markWebsiteAutoRebuildReady();
    }
  },
  destroy(/* { strapi } */) {},
};
