import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRAPI_URL = 'http://localhost:8099';
const API = `${STRAPI_URL}/api`;
const TOKEN = process.env.STRAPI_SEED_TOKEN;
if (!TOKEN) {
  console.error('Error: STRAPI_SEED_TOKEN env var is required.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

async function api(urlPath, method = 'GET', body) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${urlPath}`, opts);
  const text = await res.text();
  if (!res.ok) {
    console.error(`[${res.status}] ${method} ${urlPath}:`, text.slice(0, 300));
    return null;
  }
  return text ? JSON.parse(text) : {};
}

async function uploadFile(filePath, fileName) {
  const form = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  form.append('files', blob, fileName);
  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  Upload failed for ${fileName}:`, text.slice(0, 200));
    return null;
  }
  const data = await res.json();
  return data[0];
}

async function downloadToTemp(url, filename) {
  const tmpDir = path.join(__dirname, '../tmp-seed-images');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, filename);
  if (fs.existsSync(filePath)) return filePath;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Failed to download ${url}: ${res.status}`);
    return null;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function uploadFromUrl(url, filename) {
  const tmpPath = await downloadToTemp(url, filename);
  if (!tmpPath) return null;
  return uploadFile(tmpPath, filename);
}

async function getAll(plural, extra = '') {
  const res = await api(`/${plural}?pagination[pageSize]=100${extra}`);
  return res?.data || [];
}

async function updateEntry(plural, documentId, data) {
  return api(`/${plural}/${documentId}`, 'PUT', { data });
}

const WEBSITE_ASSETS = path.resolve(__dirname, '../../works-website/src/assets');

const PROJECT_IMAGE_MAP = {
  'banki-applikacio': { image: 'project-banking-mockup.png', homepage: 'project-banking-clean.png' },
  'logisztikai-szoftver': { image: 'project-logistics-mockup.png', homepage: 'project-logistics-clean.png' },
  'e-kereskedelmi-akadalymentesites': { image: 'project-accessibility-mockup.png', homepage: 'project-accessibility-clean.png' },
  'fintech-mobilapp': { image: 'project-fintech-mockup.png' },
  'egeszsegugyi-portal': { image: 'project-healthcare-mockup.png' },
  'ai-design-platform': { image: 'project-ai-design-mockup.png' },
};

const BLOG_IMAGE_MAP = {
  'akadalymentes-tervezes-jovoje': 'blog-accessibility.png',
  'mikro-interakciok-ux-titka': 'blog-microinteractions.png',
  'design-system-epites': 'blog-designsystem.png',
  'ai-a-ux-tervezesben': 'blog-ai-ux.png',
  'ux-kutatasi-modszerek': 'blog-ux-research.png',
  'mobile-first-tervezes': 'blog-mobile-first.png',
};

const TEAM_IMAGE_MAP = {
  'Kovács Anna': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
  'Szabó Márk': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'Tóth Eszter': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'Nagy Bence': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
  'Kiss Réka': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  'Horváth Dániel': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'Varga Lili': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'Molnár Ádám': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
  'Fehér Nóra': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
  'Lakatos Péter': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
};

const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', name: 'gallery-teamwork.jpg', alt: 'Csapatmunka a Works. irodában' },
  { url: 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?w=600&h=800&fit=crop', name: 'gallery-workshop.jpg', alt: 'Workshop vezetés' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop', name: 'gallery-sprint.jpg', alt: 'Design sprint' },
  { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=800&fit=crop', name: 'gallery-brainstorm.jpg', alt: 'Brainstorming session' },
  { url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop', name: 'gallery-event.jpg', alt: 'Csapatépítő esemény' },
  { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop', name: 'gallery-presentation.jpg', alt: 'Prezentáció' },
];

const CONTENT_BLOCK_IMAGE_INDEX = {
  'banki-applikacio': { index: 3, caption: 'Az újratervezett onboarding folyamat főbb képernyői' },
  'logisztikai-szoftver': { index: 3, caption: 'Az új logisztikai dashboard áttekintő nézete' },
  'e-kereskedelmi-akadalymentesites': { index: 3, caption: 'A javított termékoldal akadálymentességi fejlesztésekkel' },
  'fintech-mobilapp': { index: 3, caption: 'A befektetési dashboard és portfólió áttekintő' },
  'egeszsegugyi-portal': { index: 3, caption: 'Az új egészségügyi portál főoldala és időpontfoglaló felülete' },
  'ai-design-platform': { index: 3, caption: 'Az AI design asszisztens felülete működés közben' },
};

const BLOG_CONTENT_BLOCK_IMAGE = {
  'akadalymentes-tervezes-jovoje': { index: 3, caption: 'A kontraszt és olvashatóság tesztelése különböző eszközökön' },
  'mikro-interakciok-ux-titka': { index: 3, caption: 'Különböző mikro-interakciós minták mobil alkalmazásokban' },
  'design-system-epites': { index: 3, caption: 'A design system token-hierarchiája és komponens-könyvtára' },
  'ai-a-ux-tervezesben': { index: 3, caption: 'AI-támogatott design munkafolyamat vizualizáció' },
  'ux-kutatasi-modszerek': { index: 4, caption: 'Felhasználói kutatás folyamata és eszközei' },
  'mobile-first-tervezes': { index: 3, caption: 'Reszponzív tervezési elv: mobiltól desktop felé építkezve' },
};

async function seed() {
  console.log('=== Strapi Image Seeding ===\n');

  console.log('1. Uploading project images...');
  const projectImageIds = {};
  for (const [slug, files] of Object.entries(PROJECT_IMAGE_MAP)) {
    const imgPath = path.join(WEBSITE_ASSETS, files.image);
    const uploaded = await uploadFile(imgPath, files.image);
    if (uploaded) {
      projectImageIds[slug] = { imageId: uploaded.id };
      console.log(`  ✓ ${files.image} (id: ${uploaded.id})`);
    }
    if (files.homepage) {
      const hpPath = path.join(WEBSITE_ASSETS, files.homepage);
      const hpUploaded = await uploadFile(hpPath, files.homepage);
      if (hpUploaded) {
        projectImageIds[slug].homepageId = hpUploaded.id;
        console.log(`  ✓ ${files.homepage} (id: ${hpUploaded.id})`);
      }
    }
  }

  console.log('\n2. Uploading blog images...');
  const blogImageIds = {};
  for (const [slug, filename] of Object.entries(BLOG_IMAGE_MAP)) {
    const imgPath = path.join(WEBSITE_ASSETS, filename);
    const uploaded = await uploadFile(imgPath, filename);
    if (uploaded) {
      blogImageIds[slug] = uploaded.id;
      console.log(`  ✓ ${filename} (id: ${uploaded.id})`);
    }
  }

  console.log('\n3. Uploading team member portraits...');
  const teamImageIds = {};
  for (const [name, url] of Object.entries(TEAM_IMAGE_MAP)) {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ö/g, 'o').replace(/ő/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u').replace(/ű/g, 'u') + '.jpg';
    const uploaded = await uploadFromUrl(url, safeName);
    if (uploaded) {
      teamImageIds[name] = uploaded.id;
      console.log(`  ✓ ${name} (id: ${uploaded.id})`);
    }
  }

  console.log('\n4. Uploading gallery images...');
  const galleryFileIds = [];
  for (const g of GALLERY_IMAGES) {
    const uploaded = await uploadFromUrl(g.url, g.name);
    if (uploaded) {
      galleryFileIds.push(uploaded.id);
      console.log(`  ✓ ${g.name} (id: ${uploaded.id})`);
    }
  }

  console.log('\n5. Linking images to projects...');
  const projects = await getAll('projects');
  for (const proj of projects) {
    const imgs = projectImageIds[proj.slug];
    if (!imgs) continue;
    const updateData = { image: imgs.imageId };
    if (imgs.homepageId) updateData.homepageImage = imgs.homepageId;

    const blockInfo = CONTENT_BLOCK_IMAGE_INDEX[proj.slug];
    if (blockInfo) {
      const fullProj = await api(`/projects/${proj.documentId}?populate=contentBlocks`);
      if (fullProj?.data?.contentBlocks) {
        const blocks = [...fullProj.data.contentBlocks];
        const hasImageBlock = blocks.some(b => b.__component === 'content.image-block');
        if (!hasImageBlock) {
          blocks.splice(blockInfo.index, 0, {
            __component: 'content.image-block',
            image: imgs.imageId,
            caption: blockInfo.caption,
          });
          updateData.contentBlocks = blocks;
        }
      }
    }

    const res = await updateEntry('projects', proj.documentId, updateData);
    console.log(`  ${res ? '✓' : '✗'} ${proj.slug}`);
  }

  console.log('\n6. Linking images to blog posts...');
  const blogPosts = await getAll('blog-posts');
  for (const post of blogPosts) {
    const imageId = blogImageIds[post.slug];
    if (!imageId) continue;
    const updateData = { image: imageId };

    const blockInfo = BLOG_CONTENT_BLOCK_IMAGE[post.slug];
    if (blockInfo) {
      const fullPost = await api(`/blog-posts/${post.documentId}?populate=contentBlocks`);
      if (fullPost?.data?.contentBlocks) {
        const blocks = [...fullPost.data.contentBlocks];
        const hasImageBlock = blocks.some(b => b.__component === 'content.image-block');
        if (!hasImageBlock) {
          blocks.splice(blockInfo.index, 0, {
            __component: 'content.image-block',
            image: imageId,
            caption: blockInfo.caption,
          });
          updateData.contentBlocks = blocks;
        }
      }
    }

    const res = await updateEntry('blog-posts', post.documentId, updateData);
    console.log(`  ${res ? '✓' : '✗'} ${post.slug}`);
  }

  console.log('\n7. Linking images to team members...');
  const members = await getAll('team-members');
  for (const member of members) {
    const imageId = teamImageIds[member.name];
    if (!imageId) continue;
    const res = await updateEntry('team-members', member.documentId, { image: imageId });
    console.log(`  ${res ? '✓' : '✗'} ${member.name}`);
  }

  console.log('\n8. Linking gallery images to about page...');
  const aboutPage = await api('/about-page');
  if (aboutPage?.data) {
    const res = await api('/about-page', 'PUT', {
      data: { galleryImages: galleryFileIds },
    });
    console.log(`  ${res ? '✓' : '✗'} About page gallery`);
  }

  console.log('\n9. Uploading hero background and linking to global settings...');
  const heroBgPath = path.join(WEBSITE_ASSETS, 'hero-bg-pattern.png');
  if (fs.existsSync(heroBgPath)) {
    const uploaded = await uploadFile(heroBgPath, 'hero-bg-pattern.png');
    if (uploaded) {
      console.log(`  ✓ hero-bg-pattern.png (id: ${uploaded.id})`);
      const globalSetting = await api('/global-setting?populate=heroBackgroundPattern');
      if (globalSetting?.data && !globalSetting.data.heroBackgroundPattern) {
        const res = await api('/global-setting', 'PUT', {
          data: { heroBackgroundPattern: uploaded.id },
        });
        console.log(`  ${res ? '✓' : '✗'} Linked to global settings`);
      } else if (globalSetting?.data?.heroBackgroundPattern) {
        console.log('  ⊘ heroBackgroundPattern already set, skipping');
      }
    }
  }

  const tmpDir = path.join(__dirname, '../tmp-seed-images');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
    console.log('\nCleaned up temporary files.');
  }

  console.log('\n=== Image seeding complete! ===');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
