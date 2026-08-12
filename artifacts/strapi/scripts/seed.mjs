import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const { readFileSync, existsSync, writeFileSync, unlinkSync } = fs;
const { resolve, basename } = path;

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const API = 'http://localhost:8099/api';
const TOKEN = process.env.STRAPI_SEED_TOKEN;
if (!TOKEN) {
  console.error('Error: STRAPI_SEED_TOKEN env var is required. Create a full-access API token in Strapi admin and pass it.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const ATTACHED_ASSETS = resolve(__dirname, '..', '..', '..', 'attached_assets');
const WEBSITE_ASSETS = resolve(__dirname, '..', '..', 'works-website', 'src', 'assets');

function findImage(filename) {
  const p1 = resolve(ATTACHED_ASSETS, filename);
  if (existsSync(p1)) return p1;
  const p2 = resolve(WEBSITE_ASSETS, filename);
  if (existsSync(p2)) return p2;
  return null;
}

async function uploadImage(filePath, altText = '') {
  const name = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });

  const form = new FormData();
  form.append('files', blob, name);
  if (altText) {
    form.append('fileInfo', JSON.stringify({ alternativeText: altText, caption: altText }));
  }

  const res = await fetch('http://localhost:8099/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  Upload failed for ${name}: ${res.status} ${text}`);
    return null;
  }
  const data = await res.json();
  return data[0] || null;
}

async function linkMediaToSingle(contentType, field, mediaId) {
  const res = await fetch(`${API}/${contentType}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: { [field]: mediaId } }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  Link media failed for ${contentType}.${field}: ${res.status} ${text}`);
  }
}

async function api(path, method = 'GET', body, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${API}${path}`, opts);
      const text = await res.text();
      if (!text) return res.ok ? {} : null;
      let json;
      try { json = JSON.parse(text); } catch { return res.ok ? {} : null; }
      if (!res.ok) {
        console.error(`[${res.status}] ${method} ${path}:`, JSON.stringify(json.error || json, null, 2));
        return null;
      }
      return json;
    } catch (err) {
      if (attempt < retries - 1) {
        console.log(`  Retrying ${method} ${path} (attempt ${attempt + 2})...`);
        await sleep(3000);
      } else {
        throw err;
      }
    }
  }
}

async function create(plural, data) {
  const payload = { data };
  const res = await api(`/${plural}`, 'POST', payload);
  if (!res?.data) return null;
  return res.data;
}

async function createSingle(plural, data) {
  const payload = { data };
  const res = await api(`/${plural}`, 'PUT', payload);
  if (!res?.data) return null;
  return res.data;
}

async function deleteAll(plural) {
  const res = await api(`/${plural}?pagination[pageSize]=100`);
  if (!res?.data) return;
  for (const item of res.data) {
    await api(`/${plural}/${item.documentId}`, 'DELETE');
  }
}

async function seed() {
  console.log('Seeding Strapi...\n');

  console.log('Cleaning existing data...');
  for (const plural of ['career-positions', 'projects', 'services', 'clients', 'team-members', 'tags']) {
    await deleteAll(plural);
  }
  console.log('  Done.\n');

  const tagNames = [
    'UX Research', 'UI Design', 'Service Design', 'Dashboard UI',
    'User Research', 'WCAG Audit', 'Akadálymentesítés', 'UX Elemzés',
    'Konverziós stratégia', 'Webfejlesztés', 'AI Design', 'Branding',
    'Design System', 'AI', 'Mobile', 'Stratégia',
    'Kutatás', 'Senior', 'Figma', 'React', 'TypeScript', 'Frontend',
    'Workshop', 'UX',
  ];
  const uniqueTags = [...new Set(tagNames)];
  console.log(`Creating ${uniqueTags.length} tags...`);
  const tagMap = {};
  for (const name of uniqueTags) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u');
    const existing = await api(`/tags?filters[name][$eq]=${encodeURIComponent(name)}`);
    if (existing?.data?.length > 0) {
      tagMap[name] = existing.data[0].documentId;
      continue;
    }
    const tag = await create('tags', { name, slug });
    if (tag) tagMap[name] = tag.documentId;
  }
  console.log(`  Tags created: ${Object.keys(tagMap).length}\n`);

  console.log('Uploading images to Strapi media library (early phase)...');
  const imageMap = {};
  const imagesToUpload = [
    { file: 'New_logo_1773998946128.png', alt: 'Works. logo' },
    { file: 'homepage_graphic_1773999340930.png', alt: 'Homepage hero decorative graphic' },
    { file: 'bg_graphic_1774009634501.png', alt: 'Background decorative graphic 1' },
    { file: 'bg_graphic2_1774011568340.png', alt: 'Background decorative graphic 2' },
    { file: 'Purposeful_1774354143676.png', alt: 'About page hero graphic' },
    { file: 'contact-bg_1774518452836.png', alt: 'Contact page background' },
    { file: 'Frame_26081029_1774516588825.png', alt: 'Career page hero graphic' },
    { file: 'service-bg_1774270906434.png', alt: 'Service page mockup graphic' },
    { file: 'works-background_1774441334981.png', alt: 'Works background pattern' },
    { file: 'project-banking-mockup.png', alt: 'Banking app mockup' },
    { file: 'project-logistics-mockup.png', alt: 'Logistics software mockup' },
    { file: 'project-accessibility-mockup.png', alt: 'E-commerce accessibility mockup' },
    { file: 'project-fintech-mockup.png', alt: 'Fintech mobile app mockup' },
    { file: 'project-healthcare-mockup.png', alt: 'Healthcare portal mockup' },
    { file: 'project-ai-design-mockup.png', alt: 'AI design platform mockup' },
    { file: 'project-banking-clean.png', alt: 'Banking app homepage image' },
    { file: 'project-logistics-clean.png', alt: 'Logistics software homepage image' },
    { file: 'project-accessibility-clean.png', alt: 'E-commerce accessibility homepage image' },
    { file: 'blog-ux-research.png', alt: 'UX research methods' },
    { file: 'blog-mobile-first.png', alt: 'Mobile-first design' },
    { file: 'blog-ai-ux.png', alt: 'AI in UX design' },
    { file: 'blog-microinteractions.png', alt: 'Micro-interactions' },
    { file: 'blog-designsystem.png', alt: 'Design system' },
    { file: 'blog-accessibility.png', alt: 'Accessibility' },
    { file: 'UI_Design_1773998868111.png', alt: 'UI Design' },
  ];

  for (const { file, alt } of imagesToUpload) {
    const filePath = findImage(file);
    if (!filePath) {
      console.log(`  Skipped ${file} (not found)`);
      continue;
    }
    const uploaded = await uploadImage(filePath, alt);
    if (uploaded) {
      imageMap[file] = uploaded.id;
      console.log(`  Uploaded ${file} -> id ${uploaded.id}`);
    }
    await sleep(300);
  }
  console.log(`  Total uploaded: ${Object.keys(imageMap).length}\n`);

  console.log('Creating 10 team members...');
  const teamUnsplashUrls = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
  ];
  const teamData = [
    { name: 'Kovács Anna', title: 'UX Research Lead', order: 1 },
    { name: 'Szabó Márk', title: 'Design Director', order: 2 },
    { name: 'Tóth Eszter', title: 'UI Designer', order: 3 },
    { name: 'Nagy Bence', title: 'Frontend Developer', order: 4 },
    { name: 'Kiss Réka', title: 'Service Designer', order: 5 },
    { name: 'Horváth Dániel', title: 'Full-Stack Developer', order: 6 },
    { name: 'Varga Lili', title: 'UX Writer', order: 7 },
    { name: 'Molnár Ádám', title: 'Accessibility Specialist', order: 8 },
    { name: 'Fehér Nóra', title: 'Project Manager', order: 9 },
    { name: 'Lakatos Péter', title: 'Creative Technologist', order: 10 },
  ];
  const memberMap = {};
  for (let i = 0; i < teamData.length; i++) {
    const m = teamData[i];
    let imgId = null;
    try {
      const imgRes = await fetch(teamUnsplashUrls[i]);
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const tmpPath = path.join(os.tmpdir(), `team-member-${i}.jpg`);
        fs.writeFileSync(tmpPath, imgBuffer);
        const uploaded = await uploadImage(tmpPath, m.name);
        if (uploaded) imgId = uploaded.id;
        fs.unlinkSync(tmpPath);
      }
    } catch (e) {
      console.log(`  Warning: could not download team photo for ${m.name}: ${e.message}`);
    }
    const data = imgId ? { ...m, image: imgId } : m;
    const member = await create('team-members', data);
    if (member) memberMap[m.name] = member.documentId;
    await sleep(300);
  }
  console.log(`  Members created: ${Object.keys(memberMap).length}\n`);

  console.log('Creating clients...');
  const clients = [
    { name: 'Bizalmas (Bank)', initials: 'BB', order: 1, featured: true },
    { name: 'LogisticsPro Kft.', initials: 'LP', order: 2, featured: true },
    { name: 'RetailGiant International', initials: 'RG', order: 3, featured: true },
    { name: 'Fintech Innovator Zrt.', initials: 'FI', order: 4, featured: true },
    { name: 'Bizalmas (Egészségügy)', initials: 'BE', order: 5, featured: true },
    { name: 'AI Creative Labs', initials: 'AC', order: 6, featured: true },
    { name: 'MediCorp Hungary', initials: 'MC', order: 7, featured: false },
    { name: 'Budapest Digital', initials: 'BD', order: 8, featured: false },
    { name: 'GreenTech Solutions', initials: 'GT', order: 9, featured: false },
    { name: 'EduPlatform Kft.', initials: 'EP', order: 10, featured: false },
  ];
  for (const c of clients) {
    await create('clients', c);
  }
  console.log(`  Clients created: ${clients.length}\n`);

  console.log('Preparing 5 why-us items for career page...');
  const whyUsUnsplashUrls = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=500&fit=crop',
  ];
  const whyUsCards = [
    { title: 'Valódi hatás', description: 'Nem csak pixeleket mozgatunk — olyan digitális termékeket építünk, amelyek emberek százezreinek életét teszik jobbá. Minden projektünknek mérhető eredménye van.', order: 1 },
    { title: 'Folyamatos tanulás', description: 'Konferenciák, workshopok, belső tudásmegosztás és éves képzési keret. Nálunk a szakmai fejlődés nem szlogen, hanem a mindennapok része.', order: 2 },
    { title: 'Rugalmas munkavégzés', description: 'Hibrid munkavégzés, rugalmas munkaidő és modern budapesti iroda. Te döntöd el, honnan és mikor dolgozol a legjobban.', order: 3 },
    { title: 'Erős csapat', description: 'Tapasztalt szakemberek, akik szívesen segítenek és osztják meg tudásukat. Nálunk a mentorálás természetes — senki nem marad egyedül egy problémával.', order: 4 },
    { title: 'Változatos projektek', description: 'Startupoktól a nagyvállalatokig, fintechttől az egészségügyig. Garantáljuk, hogy nem fogsz unatkozni — és minden projekt új kihívást hoz.', order: 5 },
  ];
  const whyUsImageIds = [];
  for (let i = 0; i < whyUsCards.length; i++) {
    const card = whyUsCards[i];
    let imgId = null;
    try {
      const imgRes = await fetch(whyUsUnsplashUrls[i]);
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const tmpPath = path.join(os.tmpdir(), `why-us-${i}.jpg`);
        fs.writeFileSync(tmpPath, imgBuffer);
        const uploaded = await uploadImage(tmpPath, card.title);
        if (uploaded) imgId = uploaded.id;
        fs.unlinkSync(tmpPath);
      }
    } catch (e) {
      console.log(`  Warning: could not download why-us image for ${card.title}: ${e.message}`);
    }
    whyUsImageIds.push(imgId);
  }
  console.log('  Done.\n');

  console.log('Creating 3 services...');
  const servicesData = [
    {
      slug: 'ux-kutatas',
      title: 'UX Kutatás',
      subtitle: 'Felhasználók megértése, adatalappal',
      heroDescription: 'Feltárjuk a felhasználói igényeket, viselkedési mintákat és fájdalompontokat, hogy a termékfejlesztés valós adatokon alapuljon — ne feltételezéseken.',
      definitionSection: {
        kicker: 'Definíció',
        heading: 'Mi az a UX kutatás?',
        description: 'A UX kutatás (felhasználói élmény kutatás) egy módszertan, amellyel feltárjuk, hogyan gondolkodnak, éreznek és viselkednek a felhasználók egy digitális termék használata közben. Interjúk, tesztek és adatelemzés segítségével valós bizonyítékokat gyűjtünk, hogy a termékfejlesztési döntések ne megérzéseken, hanem tényeken alapuljanak. Az eredmény: kevesebb felesleges fejlesztés, jobb felhasználói élmény és mérhető üzleti eredmények.',
      },
      order: 1,
      processSteps: [
        { stepNumber: '01', title: 'Megismerés', description: 'Megismerjük az üzleti célokat, a meglévő adatokat és a kutatás céljait. Közösen meghatározzuk a kutatási kérdéseket.' },
        { stepNumber: '02', title: 'Kutatástervezés', description: 'Kiválasztjuk a megfelelő módszertant, elkészítjük a kutatási tervet és a toborzási kritériumokat.' },
        { stepNumber: '03', title: 'Terepmunka', description: 'Elvégezzük az interjúkat, teszteket és megfigyeléseket a meghatározott módszertan szerint.' },
        { stepNumber: '04', title: 'Elemzés és szintézis', description: 'Az összegyűjtött adatokat elemezzük, mintákat azonosítunk és akcióképes insightokat fogalmazunk meg.' },
        { stepNumber: '05', title: 'Átadás és javaslatok', description: 'Prezentáljuk az eredményeket és konkrét, prioritizált javaslatokkal segítjük a továbblépést.' },
      ],
      seo: { metaTitle: 'UX Kutatás | Works.', metaDescription: 'Feltárjuk a felhasználói igényeket, viselkedési mintákat és fájdalompontokat, hogy a termékfejlesztés valós adatokon alapuljon.' },
    },
    {
      slug: 'ui-design',
      title: 'UI Design',
      subtitle: 'Felületek, amelyek működnek és hatnak',
      heroDescription: 'Olyan felhasználói felületeket tervezünk, amelyek nem csak szépek, hanem érthetőek, használhatóak és üzleti eredményeket hoznak.',
      definitionSection: {
        kicker: 'Definíció',
        heading: 'Mi az a UI design?',
        description: 'A UI design (felhasználói felület tervezés) az a szakterület, amely a digitális termékek vizuális megjelenését és interakcióit alakítja ki — a színektől és tipográfiától a gombokon át a teljes képernyőtervekig. A jó UI nem csupán esztétika: érthetővé, használhatóvá és következetessé teszi a terméket, erősíti a márkát, és közvetlenül hozzájárul a konverzióhoz és a felhasználói elégedettséghez.',
      },
      order: 2,
      processSteps: [
        { stepNumber: '01', title: 'Vizuális irány', description: 'Moodboard-ok és stílus-explorációk készítése, amelyek segítenek megtalálni a megfelelő vizuális hangot.' },
        { stepNumber: '02', title: 'Wireframe és struktúra', description: 'Az oldal struktúrájának és információs architektúrájának kialakítása alacsony-fidelitású tervekkel.' },
        { stepNumber: '03', title: 'UI tervezés', description: 'A végleges, magas fidelitású felületi tervek elkészítése minden breakpointra.' },
        { stepNumber: '04', title: 'Prototípus és teszt', description: 'Kattintható prototípus készítése és tesztelése felhasználókkal a végső finomhangolás előtt.' },
        { stepNumber: '05', title: 'Design rendszer és átadás', description: 'A végleges design rendszer dokumentálása és átadása a fejlesztő csapatnak.' },
      ],
      seo: { metaTitle: 'UI Design | Works.', metaDescription: 'Olyan felhasználói felületeket tervezünk, amelyek nem csak szépek, hanem érthetőek, használhatóak és üzleti eredményeket hoznak.' },
    },
    {
      slug: 'akadalymentesites',
      title: 'Akadálymentesítés',
      subtitle: 'Digitális termékek mindenki számára',
      heroDescription: 'Segítünk, hogy digitális termékeid mindenki számára elérhetőek és használhatóak legyenek — a jogszabályi megfeleléstől a valódi inkluzivitásig.',
      definitionSection: {
        kicker: 'Definíció',
        heading: 'Mi az a digitális akadálymentesítés?',
        description: 'A digitális akadálymentesítés azt jelenti, hogy egy weboldal vagy alkalmazás mindenki számára használható — a látás-, hallás- vagy mozgássérült felhasználóknak, az idősebb korosztálynak és az átmeneti korlátozottsággal élőknek is. A nemzetközi WCAG szabvány alapján auditáljuk és javítjuk a felületeket, így a termék nemcsak a jogszabályi elvárásoknak felel meg, hanem szélesebb közönséget is elér.',
      },
      order: 3,
      processSteps: [
        { stepNumber: '01', title: 'Helyzetértékelés', description: 'A jelenlegi állapot felmérése automatizált és manuális eszközökkel, WCAG 2.1 szabvány szerint.' },
        { stepNumber: '02', title: 'Részletes audit', description: 'Oldalról oldalra haladó, komponensszintű vizsgálat dokumentált eredményekkel.' },
        { stepNumber: '03', title: 'Javítási ütemterv', description: 'Prioritizált feladatlista a kritikus, közepes és alacsony súlyosságú problémákra bontva.' },
        { stepNumber: '04', title: 'Implementációs támogatás', description: 'A fejlesztő csapat támogatása a javítások során, kód review-kkal és konzultációval.' },
        { stepNumber: '05', title: 'Végső validáció', description: 'A javítások utáni újratesztelés és a megfelelési nyilatkozat elkészítése.' },
      ],
      seo: { metaTitle: 'Akadálymentesítés | Works.', metaDescription: 'Segítünk, hogy digitális termékeid mindenki számára elérhetőek és használhatóak legyenek.' },
    },
  ];

  const serviceMap = {};
  for (const s of servicesData) {
    const { slug, subtitle, heroDescription, processSteps, ...rest } = s;
    const data = {
      ...rest,
      general: {
        slug,
        title: s.title,
        subtitle,
        heroDescription,
      },
    };
    const service = await create('services', data);
    if (service) serviceMap[slug] = service.documentId;
  }
  console.log(`  Services created: ${Object.keys(serviceMap).length}\n`);

  console.log('Creating 6 projects...');
  const projectContentBlockImages = {
    'banki-applikacio': 'project-banking-mockup.png',
    'logisztikai-szoftver': 'project-logistics-mockup.png',
    'e-kereskedelmi-akadalymentesites': 'project-accessibility-mockup.png',
    'fintech-mobilapp': 'project-fintech-mockup.png',
    'egeszsegugyi-portal': 'project-healthcare-mockup.png',
    'ai-design-platform': 'project-ai-design-mockup.png',
  };
  const projectsData = [
    {
      slug: 'banki-applikacio',
      title: 'Banki applikáció újratervezése a jobb konverzióért',
      description: 'Teljeskörű felhasználói kutatás és felülettervezés egy vezető hazai bank számára. A projekt során az onboarding folyamatot egyszerűsítettük, amivel 40%-kal növeltük a sikeres regisztrációk számát az első hónapban.',
      featured: true,
      tags: ['UX Research', 'UI Design', 'Konverziós stratégia'],
      caseStudy: { heroSubtitle: 'Hogyan növeltük 40%-kal a sikeres regisztrációkat egy vezető hazai bank mobil applikációjában.', client: 'Bizalmas', year: '2024', duration: '4 hónap' },
      contentBlocks: [
        { __component: 'content.text-block', body: 'A projekt célja egy vezető magyar bank mobilalkalmazásának teljes újratervezése volt. A korábbi alkalmazás bonyolult onboarding folyamata miatt a felhasználók jelentős része elhagyta a regisztrációt a befejezés előtt.' },
        { __component: 'content.highlight-block', quote: 'A felhasználói kutatás során kiderült, hogy a regisztrációs folyamat 12 lépésből állt — a felhasználók 67%-a a 4. lépésnél hagyta el az alkalmazást.' },
        { __component: 'content.text-block', body: 'Mélyinterjúkat és használhatósági teszteket végeztünk 30 felhasználóval. Az eredmények alapján a regisztrációs folyamatot 5 lépésre csökkentettük, progresszív adatbekéréssel. A vizuális tervezés során a bank márkaidentitását megőrizve egy modern, letisztult felületet hoztunk létre.' },
        { __component: 'content.text-block', body: 'Az eredmények önmagukért beszélnek: az első hónapban 40%-kal nőtt a sikeres regisztrációk száma, a felhasználói elégedettségi mutató (NPS) pedig 32-ről 71-re emelkedett. A bank azóta is a mi csapatunkkal fejleszti tovább az alkalmazást.' },
      ],
      seo: { metaTitle: 'Banki applikáció újratervezése | Works.', metaDescription: 'Hogyan növeltük 40%-kal a sikeres regisztrációkat egy vezető hazai bank mobil applikációjában.' },
      relatedServices: ['ux-kutatas', 'ui-design'],
    },
    {
      slug: 'logisztikai-szoftver',
      title: 'Komplex logisztikai szoftver ergonómia',
      description: 'Belső használatú vállalatirányítási rendszer modernizálása. A munkatársak napi folyamatait feltérképezve egy olyan UI-t alkottunk, ami napi átlagosan 2 órát takarít meg felhasználónként.',
      featured: false,
      tags: ['Service Design', 'Dashboard UI', 'User Research'],
      caseStudy: { heroSubtitle: 'Egy vállalatirányítási rendszer modernizálása, ami napi 2 órát takarít meg felhasználónként.', client: 'LogisticsPro Kft.', year: '2023', duration: '6 hónap' },
      contentBlocks: [
        { __component: 'content.text-block', body: 'A LogisticsPro egy 500+ alkalmazottat foglalkoztató logisztikai vállalat, amelynek belső rendszere az elmúlt 10 évben alig változott. A munkatársak napi szinten több órát töltöttek felesleges kattintásokkal és redundáns adatbevitellel.' },
        { __component: 'content.highlight-block', quote: 'A service design feltárás során 47 különböző felhasználói útvonalat azonosítottunk — ezeket 12 fő folyamatra egyszerűsítettük.' },
        { __component: 'content.text-block', body: 'A projekt során service blueprint-eket készítettünk, amelyek feltérképezték a teljes munkafolyamatot. Az új dashboard egyetlen áttekinthető felületen mutatja a legfontosabb KPI-okat, és a gyakori műveletek 2-3 kattintással elvégezhetők.' },
        { __component: 'content.text-block', body: 'A bevezetés után az átlagos feladatvégzési idő 34%-kal csökkent, a felhasználói hibák száma 60%-kal esett vissza. A rendszert azóta a cég 3 másik részlegére is kiterjesztették.' },
      ],
      seo: { metaTitle: 'Logisztikai szoftver ergonómia | Works.', metaDescription: 'Egy vállalatirányítási rendszer modernizálása, ami napi 2 órát takarít meg felhasználónként.' },
      relatedServices: [],
    },
    {
      slug: 'e-kereskedelmi-akadalymentesites',
      title: 'E-kereskedelmi platform akadálymentesítése',
      description: 'Egy nemzetközi webáruház teljes átvilágítása és javítása WCAG 2.1 AA szintnek megfelelően. A látássérült és mozgásukban korlátozott felhasználók számára is zökkenőmentessé tettük a vásárlást.',
      featured: false,
      tags: ['WCAG Audit', 'Akadálymentesítés', 'UX Elemzés'],
      caseStudy: { heroSubtitle: 'Teljes WCAG 2.1 AA megfelelés elérése egy nemzetközi webáruház számára.', client: 'RetailGiant International', year: '2024', duration: '3 hónap' },
      contentBlocks: [
        { __component: 'content.text-block', body: 'A RetailGiant webáruháza havi 2 millió egyedi látogatót szolgál ki, de az akadálymentességi tesztek során kiderült, hogy a felület számos ponton nem felel meg a WCAG 2.1 AA szabványnak. Ez nemcsak jogi kockázatot jelentett, hanem a fogyatékossággal élő felhasználók kizárását is.' },
        { __component: 'content.highlight-block', quote: 'Az audit során 234 akadálymentességi hibát azonosítottunk, amelyek közül 89 kritikus szintű volt — ezek azonnali beavatkozást igényeltek.' },
        { __component: 'content.text-block', body: 'A javítási folyamat során kiemelt figyelmet fordítottunk a képernyőolvasó-kompatibilitásra, a billentyűzetes navigációra, a megfelelő kontrasztarányokra és az ARIA attribútumok helyes használatára. Minden módosítást valós felhasználókkal teszteltünk.' },
        { __component: 'content.text-block', body: 'A projekt végére a platform teljes mértékben megfelelt a WCAG 2.1 AA szabványnak. A javítások hatására a fogyatékossággal élő felhasználók körében 45%-kal nőtt a sikeres vásárlások aránya.' },
      ],
      seo: { metaTitle: 'E-kereskedelmi akadálymentesítés | Works.', metaDescription: 'Teljes WCAG 2.1 AA megfelelés elérése egy nemzetközi webáruház számára.' },
      relatedServices: ['akadalymentesites'],
    },
    {
      slug: 'fintech-mobilapp',
      title: 'Fintech mobilalkalmazás UX stratégia',
      description: 'Egy fintech startup számára terveztünk befektetési mobilalkalmazást. A komplex pénzügyi adatokat közérthető, vizuálisan vonzó formában jelenítettük meg, ami 3x-os felhasználói növekedést eredményezett.',
      featured: false,
      tags: ['UX Research', 'UI Design', 'Service Design'],
      caseStudy: { heroSubtitle: 'Komplex pénzügyi adatok egyszerű megjelenítése egy befektetési alkalmazásban.', client: 'Fintech Innovator Zrt.', year: '2024', duration: '5 hónap' },
      contentBlocks: [
        { __component: 'content.text-block', body: 'A Fintech Innovator egy fiatal startup, amely demokratizálni kívánja a befektetések világát. Az alkalmazásnak egyszerre kellett megbízhatóságot sugároznia és könnyen érthetőnek lennie a befektetésekben kevésbé jártas felhasználók számára.' },
        { __component: 'content.highlight-block', quote: 'A célcsoport-kutatás rámutatott: a potenciális felhasználók 78%-a azért nem fektet be, mert túl bonyolultnak tartja — nem azért, mert nem érdekli.' },
        { __component: 'content.text-block', body: 'A tervezés során a progressive disclosure elvét alkalmaztuk: az egyszerű áttekintéstől a részletes elemzésekig fokozatosan mélyülhet a felhasználó. Interaktív grafikonokat és személyre szabott ajánlásokat építettünk be.' },
        { __component: 'content.text-block', body: 'A launch után 3 hónapon belül a felhasználói bázis megháromszorozódott. Az alkalmazás 4.7-es értékelést kapott az App Store-ban, és a befektetők átlagos visszatérési rátája 85% fölötti.' },
      ],
      seo: { metaTitle: 'Fintech mobilapp UX stratégia | Works.', metaDescription: 'Komplex pénzügyi adatok egyszerű megjelenítése egy befektetési alkalmazásban.' },
      relatedServices: ['ux-kutatas', 'ui-design'],
    },
    {
      slug: 'egeszsegugyi-portal',
      title: 'Egészségügyi portál újragondolása',
      description: 'Egy országos egészségügyi portál teljes újratervezése, ahol a páciensek időpontot foglalhatnak, receptet kérhetnek és hozzáférhetnek leleteikhez. Az új felület 60%-kal csökkentette a telefonos megkereséseket.',
      featured: false,
      tags: ['User Research', 'UI Design', 'Akadálymentesítés'],
      caseStudy: { heroSubtitle: 'Egy országos egészségügyi portál, amely 60%-kal csökkentette a telefonos megkereséseket.', client: 'Bizalmas', year: '2023', duration: '8 hónap' },
      contentBlocks: [
        { __component: 'content.text-block', body: 'Az egészségügyi portált havonta több mint 500 000 ember használja időpontfoglalásra, leletmegtekintésre és receptigénylésre. A korábbi felület elavult volt, és a felhasználók nagy része inkább telefonon intézte ügyeit.' },
        { __component: 'content.highlight-block', quote: 'A felhasználói tesztek során a résztvevők átlagosan 4.5 percig keresték az időpontfoglalás funkciót — az új felületen ez 30 másodpercre csökkent.' },
        { __component: 'content.text-block', body: 'Különös figyelmet fordítottunk az idősebb korosztály igényeire: nagy betűméretek, egyértelmű ikonok, egyszerű navigáció. Az akadálymentességi auditot párhuzamosan végeztük a tervezéssel, így a WCAG 2.1 AA megfelelés már az első verziótól biztosított volt.' },
        { __component: 'content.text-block', body: 'A portál indulása után a telefonos megkeresések 60%-kal csökkentek, az online időpontfoglalások száma pedig megháromszorozódott. A felhasználói elégedettség 4.2/5-re emelkedett.' },
      ],
      seo: { metaTitle: 'Egészségügyi portál újragondolása | Works.', metaDescription: 'Egy országos egészségügyi portál, amely 60%-kal csökkentette a telefonos megkereséseket.' },
      relatedServices: ['ux-kutatas', 'akadalymentesites'],
    },
    {
      slug: 'ai-design-platform',
      title: 'AI-alapú design platform prototípus',
      description: 'Egy innovatív SaaS platform tervezése és fejlesztése, amely mesterséges intelligenciával segíti a designereket a kreatív munkában. A prototípus 3 hónap alatt készült el, és azóta béta tesztelés alatt áll.',
      featured: false,
      tags: ['AI Design', 'UI Design', 'Webfejlesztés'],
      caseStudy: { heroSubtitle: 'Mesterséges intelligencia a kreatív munka szolgálatában — egy SaaS platform születése.', client: 'AI Creative Labs', year: '2024', duration: '3 hónap' },
      contentBlocks: [
        { __component: 'content.text-block', body: 'Az AI Creative Labs egy olyan platformot álmodott meg, amely generatív AI segítségével gyorsítja fel a design munkafolyamatokat. A kihívás az volt, hogy az AI képességeit intuitív, nem technikai felhasználók számára is elérhető módon kellett csomagolni.' },
        { __component: 'content.highlight-block', quote: 'A legnagyobb tervezési kihívás: hogyan tegyük átláthatóvá az AI döntéseit, hogy a designerek bízzanak az eszközben, ne érezzék fenyegetésnek.' },
        { __component: 'content.text-block', body: 'A felületen az AI javaslatokat vizuális kártyaként jelenítettük meg, amelyeket a felhasználó elfogadhat, módosíthat vagy elvethet. Minden javaslat mellett megjelenik az AI gondolkodási folyamata, ami átláthatóvá teszi a döntéseket.' },
        { __component: 'content.text-block', body: 'A béta teszt első hónapjában 200+ designer regisztrált. Az átlagos design iterációs idő 40%-kal csökkent az AI javaslatok használatával. A platform jelenleg seed finanszírozási körben van.' },
      ],
      seo: { metaTitle: 'AI design platform prototípus | Works.', metaDescription: 'Mesterséges intelligencia a kreatív munka szolgálatában — egy SaaS platform születése.' },
      relatedServices: ['ui-design'],
    },
  ];

  const projectMap = {};
  for (const p of projectsData) {
    const { relatedServices, ...rest } = p;
    const blocks = [...(rest.contentBlocks || [])];
    const cbImgFile = projectContentBlockImages[p.slug];
    if (cbImgFile && imageMap[cbImgFile]) {
      blocks.splice(2, 0, { __component: 'content.image-block', image: imageMap[cbImgFile], caption: `${p.title} — projekt képernyőkép` });
    }
    const data = {
      ...rest,
      contentBlocks: blocks,
      tags: p.tags.map(t => tagMap[t]).filter(Boolean).map(id => ({ documentId: id })),
      services: (relatedServices || []).map(s => serviceMap[s]).filter(Boolean).map(id => ({ documentId: id })),
    };
    const project = await create('projects', data);
    if (project) projectMap[p.slug] = project.documentId;
  }
  console.log(`  Projects created: ${Object.keys(projectMap).length}\n`);

  // Blog posts are NOT seeded: real articles are migrated from the old
  // Squarespace site (scripts/squarespace-extract.mjs + migrateSquarespacePosts
  // in src/index.ts) and must never be recreated or deleted by the seed.

  console.log('Creating 4 career positions...');
  const positionsData = [
    {
      slug: 'senior-ux-researcher',
      title: 'Senior UX Researcher',
      team: 'Kutatás',
      location: 'Budapest / Hibrid',
      type: 'Teljes munkaidő',
      isActive: true,
      tags: ['UX Research', 'Kutatás', 'Senior'],
      excerpt: 'Vezető kutatóként komplex felhasználói kutatási projekteket vezetsz, mélyinterjúktól a használhatósági tesztekig. Tapasztalatod segíti csapatunkat az adatvezérelt designdöntésekben.',
      contentBlocks: [
        { __component: 'content.text-block', body: 'A Works. kutatócsapatában a felhasználói igények feltárása és megértése a legfontosabb feladatunk. Senior UX Researcherként te leszel az, aki komplex kutatási projekteket tervez és vezet, az ügyfelek és a belső csapat között hidat képezve.' },
        { __component: 'content.highlight-block', quote: 'Nálunk a kutatás nem utólagos gondolat — minden projekt a felhasználói igények megértésével indul, és ez a szemlélet áthatja a teljes munkánkat.' },
        { __component: 'content.text-block', body: 'Feladataid között szerepel mélyinterjúk és használhatósági tesztek tervezése és levezetése, kutatási eredmények szintetizálása és prezentálása, perszonák és journey map-ek készítése, valamint a design csapattal való szoros együttműködés.' },
        { __component: 'content.text-block', body: 'Amit várunk: legalább 4 év UX kutatási tapasztalat, erős analitikus gondolkodás, kiváló prezentációs készségek és a felhasználókért való szenvedélyes kiállás. Előnyt jelent a pszichológiai vagy szociológiai háttér.' },
        { __component: 'content.text-block', body: 'Amit kínálunk: versenyképes fizetés, rugalmas munkaidő és hibrid munkavégzés, éves képzési keret, modern budapesti iroda és egy csapat, amelyik valóban törődik a munkája minőségével.' },
      ],
      seo: { metaTitle: 'Senior UX Researcher — Karrier | Works.', metaDescription: 'Vezető kutatóként komplex felhasználói kutatási projekteket vezetsz.' },
    },
    {
      slug: 'ui-designer',
      title: 'UI Designer',
      team: 'Design',
      location: 'Budapest / Hibrid',
      type: 'Teljes munkaidő',
      isActive: true,
      tags: ['UI Design', 'Figma', 'Design System'],
      excerpt: 'Vizuálisan kiemelkedő, felhasználóbarát felületeket tervezel webes és mobil alkalmazásokhoz. A design rendszerek építése és karbantartása is a feladataid közé tartozik.',
      contentBlocks: [
        { __component: 'content.text-block', body: 'UI Designerként a Works. kreatív csapatának tagjaként dolgozol, ahol a kutatási eredményeket vizuálisan meggyőző, használható felületekké alakítod. Figma-ban dolgozunk, és nagy hangsúlyt fektetünk a design rendszerek építésére.' },
        { __component: 'content.highlight-block', quote: 'A jó UI design nem a szépségről szól — hanem arról, hogy a felhasználó természetesen, gondolkodás nélkül navigáljon a felületen.' },
        { __component: 'content.text-block', body: 'Feladataid: webes és mobil felületek tervezése Figma-ban, design system komponensek építése és dokumentálása, szoros együttműködés a fejlesztőkkel a pixel-perfect implementáció érdekében, és részvétel design critique sessionökön.' },
        { __component: 'content.text-block', body: 'Amit várunk: 2-3 év UI design tapasztalat, erős Figma tudás, tipográfiai és layout érzék, valamint érdeklődés az akadálymentesség iránt. Portfolió bemutatása szükséges.' },
        { __component: 'content.text-block', body: 'Amit kínálunk: kreatív szabadság, változatos projektek startuptól a nagyvállalatokig, szakmai fejlődési lehetőségek és egy inspiráló csapat.' },
      ],
      seo: { metaTitle: 'UI Designer — Karrier | Works.', metaDescription: 'Vizuálisan kiemelkedő, felhasználóbarát felületeket tervezel webes és mobil alkalmazásokhoz.' },
    },
    {
      slug: 'frontend-fejleszto',
      title: 'Frontend Fejlesztő',
      team: 'Fejlesztés',
      location: 'Budapest / Remote',
      type: 'Teljes munkaidő',
      isActive: true,
      tags: ['React', 'TypeScript', 'Frontend'],
      excerpt: 'Modern webes alkalmazásokat fejlesztesz React és TypeScript technológiákkal. A designerekkel szorosan együttműködve pixel-perfect, akadálymentes felületeket valósítasz meg.',
      contentBlocks: [
        { __component: 'content.text-block', body: 'Frontend Fejlesztőként a Works. fejlesztői csapatában dolgozol, ahol a designerek által tervezett felületeket kelted életre. Modern technológiai stackkel dolgozunk: React, TypeScript, Tailwind CSS, Framer Motion és Next.js.' },
        { __component: 'content.highlight-block', quote: 'Nálunk a fejlesztők nem \u201Emegvalósítók\u201D — aktív résztvevői a tervezési folyamatnak, és a technológiai döntésekbe is beleszólnak.' },
        { __component: 'content.text-block', body: 'Feladataid: reszponzív, akadálymentes webes felületek fejlesztése, komponenskönyvtárak építése és karbantartása, teljesítményoptimalizálás, és code review-k végzése.' },
        { __component: 'content.text-block', body: 'Amit várunk: legalább 3 év frontend fejlesztési tapasztalat, erős React és TypeScript tudás, CSS/Tailwind magabiztosság, és érdeklődés a design rendszerek iránt. Git workflow ismerete szükséges.' },
        { __component: 'content.text-block', body: 'Amit kínálunk: teljes remote lehetőség, versenyképes fizetés, modern technológiai stack, és egy csapat ahol a kódminőség nem kompromisszum kérdése.' },
      ],
      seo: { metaTitle: 'Frontend Fejlesztő — Karrier | Works.', metaDescription: 'Modern webes alkalmazásokat fejlesztesz React és TypeScript technológiákkal.' },
    },
    {
      slug: 'service-designer',
      title: 'Service Designer',
      team: 'Stratégia',
      location: 'Budapest / Hibrid',
      type: 'Teljes munkaidő',
      isActive: true,
      tags: ['Service Design', 'Stratégia', 'Workshop'],
      excerpt: 'Komplex szolgáltatás-tervezési projekteket vezetsz, az ügyfél üzleti céljainak és a felhasználói igényeknek az összehangolásával. Workshop-facilitáció és service blueprint készítés a mindennapjaid része.',
      contentBlocks: [
        { __component: 'content.text-block', body: 'Service Designerként a Works. stratégiai csapatában dolgozol, ahol a digitális és fizikai érintkezési pontokat egyaránt átlátó, rendszerszintű megoldásokat tervezel. A munkád az üzleti stratégia és a felhasználói élmény metszéspontjában helyezkedik el.' },
        { __component: 'content.highlight-block', quote: 'A service design nem egy lépés a folyamatban — hanem a szemlélet, amellyel az egész folyamatot átlátjuk és alakítjuk.' },
        { __component: 'content.text-block', body: 'Feladataid: service blueprint-ek és journey map-ek készítése, workshopok facilitálása ügyfelekkel és stakeholderekkel, üzleti és felhasználói igények összehangolása, valamint a design csapattal való szoros együttműködés a megoldások kidolgozásában.' },
        { __component: 'content.text-block', body: 'Amit várunk: 3+ év service design vagy UX stratégiai tapasztalat, workshop facilitációs készségek, rendszerszintű gondolkodás, és kiváló kommunikációs képességek magyarul és angolul egyaránt.' },
        { __component: 'content.text-block', body: 'Amit kínálunk: stratégiai szintű projektek vezető hazai és nemzetközi ügyfelekkel, szakmai közösség, és a lehetőség, hogy valódi hatást gyakorolj a digitális szolgáltatások világára.' },
      ],
      seo: { metaTitle: 'Service Designer — Karrier | Works.', metaDescription: 'Komplex szolgáltatás-tervezési projekteket vezetsz az ügyfél üzleti céljainak és a felhasználói igényeknek az összehangolásával.' },
    },
  ];

  const careerImgId = imageMap['UI_Design_1773998868111.png'];
  for (const p of positionsData) {
    const blocks = [...(p.contentBlocks || [])];
    if (careerImgId && blocks.length >= 2) {
      blocks.splice(1, 0, { __component: 'content.image-block', image: careerImgId, caption: `${p.title} — munkakörnyezet` });
    }
    const { location, type, tags: pTags, contentBlocks: _cb, ...pRest } = p;
    const data = {
      ...pRest,
      contentBlocks: blocks,
      tags: pTags.map(t => tagMap[t]).filter(Boolean).map(id => ({ documentId: id })),
    };
    await create('career-positions', data);
  }
  console.log('  Done.\n');

  console.log('Seeding single types...');

  await createSingle('global-setting', {
    siteName: 'Works.',
    contactEmail: 'hello@works.hu',
    contactPhone: '+36 1 234 5678',
    address: '1054 Budapest, Szabadság tér 7.',
    footerTagline: 'Digitális termékeket tervezünk,\namelyekkel az emberek szeretnek dolgozni.',
    newsletterHeading: 'Iratkozz fel hírlevelünkre',
    newsletterDescription: 'Havonta egyszer küldünk friss UX/UI tippeket, esettanulmányokat és szakmai újdonságokat.',
    copyrightText: '2024 Works. Minden jog fenntartva.',
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/company/works-agency' },
      { platform: 'Instagram', url: 'https://instagram.com/works.agency' },
      { platform: 'Dribbble', url: 'https://dribbble.com/works-agency' },
      { platform: 'Behance', url: 'https://behance.net/works-agency' },
    ],
    openingHours: [
      { day: 'Hétfő - Péntek', hours: '9:00 - 18:00' },
      { day: 'Szombat - Vasárnap', hours: 'Zárva' },
    ],
    legalLinks: [
      { label: 'Adatvédelmi tájékoztató', url: '/adatvedelem' },
      { label: 'Süti szabályzat', url: '/suti-szabalyzat' },
      { label: 'Impresszum', url: '/impresszum' },
    ],
  });
  console.log('  Global settings done.');

  await createSingle('homepage', {
    seo: { metaTitle: 'Works. | Digitális Ügynökség', metaDescription: 'Magyar digitális ügynökség — UX kutatás, service design, UI design, akadálymentesítés, AI-alapú tervezés, webfejlesztés.' },
    hero: {
      heading: 'Digitális élményeket tervezünk',
      highlightedWord: 'élményeket',
      description: 'UX kutatás, UI design és fejlesztés — egy csapattól. Segítünk, hogy digitális termékeid valódi értéket teremtsenek.',
      primaryCtaText: 'Projektjeink',
      primaryCtaLink: '/projektek',
      secondaryCtaText: 'Kapcsolat',
      secondaryCtaLink: '/kapcsolat',
    },
    servicesSection: { heading: 'Szolgáltatásaink' },
    projectsSection: { heading: 'Kiemelt munkáink' },
    ctaBanner: { heading: 'Van egy ötleted? Beszéljünk róla!', ctaText: 'Kapcsolatfelvétel', ctaLink: '/kapcsolat' },
    blogSection: { heading: 'Friss a blogról' },
  });
  console.log('  Homepage done.');

  await createSingle('about-page', {
    seo: { metaTitle: 'Rólunk | Works.', metaDescription: 'Ismerd meg a Works. csapatát — tapasztalt UX kutatók, UI designerek és fejlesztők, akik digitális termékekkel tesznek hatást.' },
    hero: { heading: 'Rólunk', description: 'Egy csapat, amely hisz abban, hogy a jó design megváltoztatja a világot.' },
    intro: {
      heading: 'Kik vagyunk?',
      body: 'A Works. egy budapesti digitális ügynökség, amelyet 2018-ban alapítottunk azzal a hittel, hogy a design és a technológia együtt képes valódi hatást elérni. Csapatunk UX kutatókból, UI designerekből, fejlesztőkből és stratégákból áll, akik közösen dolgoznak azon, hogy ügyfeleink digitális termékei ne csak szépek, hanem használhatóak és eredményesek is legyenek.',
    },
  });
  console.log('  About page done.');

  await createSingle('contact-page', {
    seo: { metaTitle: 'Kapcsolat | Works.', metaDescription: 'Vedd fel velünk a kapcsolatot! Budapesti irodánkban vagy online is elérhetőek vagyunk UX, UI és webfejlesztési projektekhez.' },
    hero: { heading: 'Kapcsolat', description: 'Beszéljünk a következő projektedről!' },
    formHeading: 'Írj nekünk',
    formSubjects: [
      { label: 'Új projekt', value: 'new-project' },
      { label: 'Árajánlat kérés', value: 'quote' },
      { label: 'Partnerség', value: 'partnership' },
      { label: 'Karrier', value: 'career' },
      { label: 'Egyéb', value: 'other' },
    ],
    successTitle: 'Köszönjük!',
    successMessage: 'Üzeneted megkaptuk, hamarosan felvesszük veled a kapcsolatot.',
    mapHeading: 'Látogass el hozzánk',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.6743700927!2d19.0512!3d47.5025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDMwJzA5LjAiTiAxOcKwMDMnMDQuMyJF!5e0!3m2!1shu!2shu!4v1',
  });
  console.log('  Contact page done.');

  const whyUsItems = whyUsCards.map((card, i) => {
    const item = { title: card.title, description: card.description };
    if (whyUsImageIds[i]) item.image = whyUsImageIds[i];
    return item;
  });
  await createSingle('career-page', {
    seo: { metaTitle: 'Karrier | Works.', metaDescription: 'Csatlakozz a Works. csapatához! Nyitott pozícióink UX kutatás, UI design, fejlesztés és service design területeken.' },
    hero: { heading: 'Karrier', description: 'Csatlakozz egy csapathoz, ahol a munkád valódi hatást tesz.' },
    whyUs: { sectionHeading: 'Miért jó nálunk dolgozni?', items: whyUsItems },
  });
  console.log('  Career page done.');

  console.log('\nLinking images to single types and media fields...');

  if (imageMap['New_logo_1773998946128.png']) {
    await linkMediaToSingle('global-setting', 'logo', imageMap['New_logo_1773998946128.png']);
    await linkMediaToSingle('global-setting', 'favicon', imageMap['New_logo_1773998946128.png']);
    console.log('  Global: logo + favicon');
  }
  if (imageMap['homepage_graphic_1773999340930.png']) {
    await linkMediaToSingle('global-setting', 'heroBackgroundPattern', imageMap['homepage_graphic_1773999340930.png']);
    console.log('  Global: heroBackgroundPattern');
  }
  if (imageMap['bg_graphic_1774009634501.png']) {
    await linkMediaToSingle('global-setting', 'bgGraphic1', imageMap['bg_graphic_1774009634501.png']);
    console.log('  Global: bgGraphic1');
  }
  if (imageMap['bg_graphic2_1774011568340.png']) {
    await linkMediaToSingle('global-setting', 'bgGraphic2', imageMap['bg_graphic2_1774011568340.png']);
    console.log('  Global: bgGraphic2');
  }
  if (imageMap['works-background_1774441334981.png']) {
    await linkMediaToSingle('global-setting', 'ogImage', imageMap['works-background_1774441334981.png']);
    console.log('  Global: ogImage');
  }

  if (imageMap['homepage_graphic_1773999340930.png']) {
    const hpRes = await api('/homepage?populate=hero');
    if (hpRes?.data) {
      const existingHero = hpRes.data.hero || {};
      await api('/homepage', 'PUT', {
        data: { hero: { heading: existingHero.heading || '', highlightedWord: existingHero.highlightedWord || '', description: existingHero.description || '', primaryCtaText: existingHero.primaryCtaText || '', primaryCtaLink: existingHero.primaryCtaLink || '', secondaryCtaText: existingHero.secondaryCtaText || '', secondaryCtaLink: existingHero.secondaryCtaLink || '', backgroundImage: imageMap['homepage_graphic_1773999340930.png'] } }
      });
      console.log('  Homepage: hero.backgroundImage');
    }
  }

  if (imageMap['Purposeful_1774354143676.png']) {
    const apRes = await api('/about-page?populate=hero');
    if (apRes?.data) {
      const existingHero = apRes.data.hero || {};
      await api('/about-page', 'PUT', {
        data: { hero: { heading: existingHero.heading || '', description: existingHero.description || '', backgroundImage: imageMap['Purposeful_1774354143676.png'] } }
      });
      console.log('  About page: hero.backgroundImage');
    }
  }


  if (imageMap['contact-bg_1774518452836.png']) {
    const cpRes = await api('/contact-page?populate=hero');
    if (cpRes?.data) {
      const existingHero = cpRes.data.hero || {};
      await api('/contact-page', 'PUT', {
        data: {
          hero: { heading: existingHero.heading || '', description: existingHero.description || '', backgroundImage: imageMap['contact-bg_1774518452836.png'] },
          backgroundImage: imageMap['contact-bg_1774518452836.png'],
        }
      });
      console.log('  Contact page: hero.backgroundImage + backgroundImage');
    }
  }

  if (imageMap['Frame_26081029_1774516588825.png']) {
    const crRes = await api('/career-page?populate=hero');
    if (crRes?.data) {
      const existingHero = crRes.data.hero || {};
      await api('/career-page', 'PUT', {
        data: { hero: { heading: existingHero.heading || '', description: existingHero.description || '', backgroundImage: imageMap['Frame_26081029_1774516588825.png'] } }
      });
      console.log('  Career page: hero.backgroundImage');
    }
  }

  if (imageMap['service-bg_1774270906434.png']) {
    const svcRes = await api('/services?populate=general&pagination[pageSize]=100');
    if (svcRes?.data) {
      for (const svc of svcRes.data) {
        const existingGeneral = svc.general || {};
        await api(`/services/${svc.documentId}`, 'PUT', {
          data: { general: { ...existingGeneral, heroImage: imageMap['service-bg_1774270906434.png'] } }
        });
      }
      console.log(`  Services: heroImage (${svcRes.data.length} services)`);
    }
  }


  const projectImageMapping = {
    'banki-applikacio': { image: 'project-banking-mockup.png', homepageImage: 'project-banking-clean.png' },
    'logisztikai-szoftver': { image: 'project-logistics-mockup.png', homepageImage: 'project-logistics-clean.png' },
    'e-kereskedelmi-akadalymentesites': { image: 'project-accessibility-mockup.png', homepageImage: 'project-accessibility-clean.png' },
    'fintech-mobilapp': { image: 'project-fintech-mockup.png' },
    'egeszsegugyi-portal': { image: 'project-healthcare-mockup.png' },
    'ai-design-platform': { image: 'project-ai-design-mockup.png' },
  };

  for (const [slug, mapping] of Object.entries(projectImageMapping)) {
    const docId = projectMap[slug];
    if (!docId) continue;
    const updates = {};
    if (mapping.image && imageMap[mapping.image]) updates.image = imageMap[mapping.image];
    if (mapping.homepageImage && imageMap[mapping.homepageImage]) updates.homepageImage = imageMap[mapping.homepageImage];
    if (Object.keys(updates).length > 0) {
      await api(`/projects/${docId}`, 'PUT', { data: updates });
      console.log(`  Project ${slug}: ${Object.keys(updates).join(', ')}`);
    }
  }

  const blogImageMapping = {
    'akadalymentes-tervezes-jovoje': 'blog-accessibility.png',
    'mikro-interakciok-ux-titka': 'blog-microinteractions.png',
    'design-system-epites': 'blog-designsystem.png',
    'ai-a-ux-tervezesben': 'blog-ai-ux.png',
    'ux-kutatasi-modszerek': 'blog-ux-research.png',
    'mobile-first-tervezes': 'blog-mobile-first.png',
  };

  const blogRes = await api('/blog-posts?pagination[pageSize]=100');
  if (blogRes?.data) {
    for (const post of blogRes.data) {
      const imgFile = blogImageMapping[post.slug];
      if (imgFile && imageMap[imgFile]) {
        await api(`/blog-posts/${post.documentId}`, 'PUT', {
          data: { image: imageMap[imgFile] }
        });
        console.log(`  Blog ${post.slug}: image`);
      }
    }
  }

  console.log('  Image linking complete.\n');

  console.log('\nSeeding complete!');
}

seed().catch(console.error);
