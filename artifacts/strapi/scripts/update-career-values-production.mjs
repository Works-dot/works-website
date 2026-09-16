import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { canonical, checksum } from './translation-pipeline-lib.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const __dirname = path.dirname(SCRIPT_PATH);

function assertSupportedRuntime(version = process.versions.node) {
  const major = Number.parseInt(version.split('.')[0], 10);
  if (!Number.isInteger(major) || major < 18 || major > 22) {
    throw new Error(
      `Unsupported Node.js runtime ${version}; production runner requires Node.js 18 through 22.`,
    );
  }
}

const INVOKED_SCRIPT = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (INVOKED_SCRIPT === SCRIPT_PATH) assertSupportedRuntime();

// This runner intentionally uses only Strapi's registration and database model
// initialization. It never calls app.load(), app.bootstrap(), app.start(), or
// any lifecycle that could run migrations, seeds, cron jobs, or application
// side-effects against the production database.
const { compileStrapi, createStrapi } = createRequire(import.meta.url)('@strapi/strapi');
const strapiRequire = createRequire(createRequire(import.meta.url).resolve('@strapi/strapi'));
const corePackage = strapiRequire.resolve('@strapi/core/package.json');
const { transformContentTypesToModels } = strapiRequire(
  path.join(path.dirname(corePackage), 'dist/utils/transform-content-types-to-models.js'),
);
const STRAPI_ROOT = path.resolve(__dirname, '..');
const ATTACHED_ASSETS = path.resolve(STRAPI_ROOT, '..', '..', 'attached_assets');
const UPLOADS_ROOT = path.join(STRAPI_ROOT, 'public', 'uploads');
const DEFAULT_SNAPSHOT_DIR = '/tmp/works-career-prod-prechange';
const REPORT_PATH = process.env.PRODUCTION_REPORT_PATH || '/tmp/works-career-prod-update-report.json';
const APPROVED_DEV_REPORT_PATH = process.env.APPROVED_DEV_VALUES_REPORT
  || path.join(STRAPI_ROOT, '.tmp', 'career-values-three-report.json');
const APPROVED_DEV_SNAPSHOT_PATH = process.env.APPROVED_DEV_VALUES_SNAPSHOT
  || path.join(STRAPI_ROOT, '.tmp', 'career-values-three-before.json');
const CAREER_UID = 'api::career-page.career-page';
const LOCALES = ['hu', 'en'];
const STATUSES = ['draft', 'published'];
const PUBLIC_STRAPI_ORIGIN = (
  process.env.PUBLIC_STRAPI_ORIGIN
  || 'https://workspacestrapi-production.up.railway.app/strapi'
).replace(/\/+$/, '');
const SYSTEM_FIELDS = new Set([
  'id',
  'documentId',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'locale',
  'localizations',
]);

const VALUES = {
  hu: [
    {
      title: 'Együttműködés',
      file: 'egyuttmukodes-new_1789551061820.png',
      hash: 'egyuttmukodes_new_1789551061820_81012c650c',
      sourceSha256: '7cb88368f84c724b9b128e4502e79be5d268da3d61ff66346877cb90ee5f5c10',
      formatSha256: {
        small: '8cfac8f9becd99e5116406a98209fe22b2cbc3f065497497e3cbcd3f38aa771c',
        medium: '7c2254e426aeadc43899f1a6c87d87083dff249ff37830a5d5d872a49fbadaa7',
        thumbnail: '700173fbd28b40bb766d7bfdbb5a7f135932a92df5fbe1ffe9ed5ca30d4a1589',
      },
    },
    {
      title: 'Alkalmazkodás',
      file: 'alkalmazkodas-new_1789551061821.png',
      hash: 'alkalmazkodas_new_1789551061821_d296cb66d4',
      sourceSha256: '53eed55739ed63bf7b95bef9a228e5e8e0de59bc380338609b9ca75000bfefd5',
      formatSha256: {
        small: '9bd1b0c989b0bbb3c7e4b3d81a59d3259d3a9356d1b8e9087f497378da6ce1af',
        medium: '90da992154d07e0a97e6176623ae9c09a752c4e755726c35710cf06ca9f0858e',
        thumbnail: '5aab9e496b379e93712f647ed28496ea80fd0e2d7ffd4e716ff682cac36d1189',
      },
    },
    {
      title: 'Empátia',
      file: 'empatia-new_1789551061821.png',
      hash: 'empatia_new_1789551061821_932264da68',
      sourceSha256: '2530ebebf4b94d636ad811ff62bb5d8f9326a0445e134d7be76f3b19d7c70d7f',
      formatSha256: {
        small: '4eeb30c7c374eca1ef4568dbf945b9ca519e2f4bcfcaf62f701b4d74049aec43',
        medium: '6263ad783357fba8dc4feb82bf12ce65cd70dd767a0d442093093e5e0e964151',
        thumbnail: 'f6f6f96a358f8db7933681f1bd94d4ff109007fe1c7b48317ebdd0c38bb10c27',
      },
    },
  ],
  en: [
    { title: 'Collaboration', file: 'egyuttmukodes-new_1789551061820.png' },
    { title: 'Adaptability', file: 'alkalmazkodas-new_1789551061821.png' },
    { title: 'Empathy', file: 'empatia-new_1789551061821.png' },
  ],
};

const REMOVED_TITLES = {
  hu: 'Céltudatosság',
  en: 'Purposefulness',
};

const EXPECTED_IMAGE_DIMENSIONS = { width: 960, height: 610 };

const FORMAT_SPECS = [
  { key: 'small', prefix: 'small_', width: 500, height: 318 },
  { key: 'medium', prefix: 'medium_', width: 750, height: 477 },
  { key: 'thumbnail', prefix: 'thumbnail_', width: 245, height: 156 },
];

const PAGE_POPULATE = {
  seo: { populate: ['*'] },
  hero: { populate: ['backgroundImage'] },
  workWithUs: { populate: ['*'] },
  whyUs: { populate: { items: { populate: ['image'] } } },
};

function parseArgs(argv) {
  if (argv.length !== 1 || !['--dry-run', '--apply-production', '--restore-production'].includes(argv[0])) {
    throw new Error(
      'Refusing production update. Use exactly one of --dry-run, --apply-production, or --restore-production.',
    );
  }
  return {
    apply: argv[0] === '--apply-production',
    restore: argv[0] === '--restore-production',
  };
}

function databaseIdentity(value) {
  const url = new URL(value);
  return [
    url.hostname.toLowerCase(),
    url.port || '5432',
    decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, ''),
  ].join('|');
}

function assertProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Refusing production runner unless NODE_ENV=production.');
  }
  const target = process.env.STRAPI_DATABASE_URL || process.env.DATABASE_URL;
  const production = process.env.PRODUCTION_DATABASE_URL;
  if (!target || !production) {
    throw new Error('STRAPI_DATABASE_URL/DATABASE_URL and PRODUCTION_DATABASE_URL are required.');
  }
  if (databaseIdentity(target) !== databaseIdentity(production)) {
    throw new Error('Refusing production runner: target database identity does not match PRODUCTION_DATABASE_URL.');
  }
  const targetUrl = new URL(target);
  if (['localhost', '127.0.0.1', '::1'].includes(targetUrl.hostname.toLowerCase())) {
    throw new Error('Refusing production runner against a local database.');
  }
  if (!process.env.STRAPI_APP_KEYS) {
    throw new Error('STRAPI_APP_KEYS must be loaded for the scoped Strapi model runner.');
  }
}

async function withScopedStrapi(callback) {
  const context = await compileStrapi({ ignoreDiagnostics: true });
  const app = await createStrapi(context).register();
  const models = [
    ...transformContentTypesToModels(
      [...Object.values(app.contentTypes), ...Object.values(app.components)],
      app.db.metadata.identifiers,
    ),
    ...app.get('models').get(),
  ];
  await app.db.init({ models });
  app.log.level = 'error';
  try {
    return await callback(app);
  } finally {
    try {
      await app.destroy();
    } catch (error) {
      if (error?.message !== 'aborted') throw error;
    }
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function inspectPng(buffer, expectedWidth, expectedHeight, label) {
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${label} is not a PNG.`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`${label} dimensions are ${width}x${height}; expected ${expectedWidth}x${expectedHeight}.`);
  }
}

function publicAssetUrl(relativeUrl) {
  return `${PUBLIC_STRAPI_ORIGIN}/${relativeUrl.replace(/^\/+/, '')}`;
}

async function verifyPublicAsset(relativeUrl, expectedSha256, label) {
  const response = await fetch(publicAssetUrl(relativeUrl));
  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const actualSha256 = sha256(bytes);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`${label} SHA-256 mismatch (${actualSha256} != ${expectedSha256}).`);
  }
  return { status: response.status, bytes: bytes.length, sha256: actualSha256 };
}

async function prepareMediaDefinitions() {
  const definitions = [];
  for (const source of VALUES.hu) {
    const sourcePath = path.join(ATTACHED_ASSETS, source.file);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing source asset ${sourcePath}.`);
    const sourceBuffer = await fsp.readFile(sourcePath);
    inspectPng(
      sourceBuffer,
      EXPECTED_IMAGE_DIMENSIONS.width,
      EXPECTED_IMAGE_DIMENSIONS.height,
      source.file,
    );
    const sourceSha256 = sha256(sourceBuffer);
    if (sourceSha256 !== source.sourceSha256) {
      throw new Error(`${source.file} source SHA-256 does not match the approved committed original.`);
    }

    const url = `/uploads/${source.hash}.png`;
    const formats = {};
    const formatFiles = [];
    for (const format of FORMAT_SPECS) {
      const formatFile = `${format.prefix}${source.hash}.png`;
      const formatPath = path.join(UPLOADS_ROOT, formatFile);
      if (!fs.existsSync(formatPath)) throw new Error(`Missing committed seed format ${formatPath}.`);
      const formatBuffer = await fsp.readFile(formatPath);
      inspectPng(formatBuffer, format.width, format.height, formatFile);
      const formatSha256 = sha256(formatBuffer);
      if (formatSha256 !== source.formatSha256[format.key]) {
        throw new Error(`${formatFile} SHA-256 does not match the approved committed seed.`);
      }
      const formatUrl = `/uploads/${formatFile}`;
      const formatSize = Number((formatBuffer.length / 1000).toFixed(2));
      formats[format.key] = {
        ext: '.png',
        url: formatUrl,
        hash: formatFile.slice(0, -4),
        mime: 'image/png',
        name: `${format.prefix}${source.file}`,
        path: null,
        size: formatSize,
        width: format.width,
        height: format.height,
        sizeInBytes: formatBuffer.length,
      };
      formatFiles.push({
        name: formatFile,
        path: formatPath,
        url: formatUrl,
        sha256: formatSha256,
        bytes: formatBuffer.length,
      });
    }

    definitions.push({
      ...source,
      name: source.file,
      alternativeText: source.title,
      url,
      ext: '.png',
      mime: 'image/png',
      width: EXPECTED_IMAGE_DIMENSIONS.width,
      height: EXPECTED_IMAGE_DIMENSIONS.height,
      size: Number((sourceBuffer.length / 1000).toFixed(2)),
      sourceBytes: sourceBuffer.length,
      formats,
      formatFiles,
      sourcePath,
      provider: 'local',
    });
  }
  return definitions;
}

async function verifySeedFiles(definitions) {
  const checks = [];
  for (const definition of definitions) {
    checks.push(await verifyPublicAsset(
      definition.url,
      definition.sourceSha256,
      `${definition.file} original`,
    ));
    for (const format of definition.formatFiles) {
      checks.push(await verifyPublicAsset(
        format.url,
        format.sha256,
        `${format.name}`,
      ));
    }
  }
  return checks;
}

function isMediaRecord(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof value.url === 'string'
      && typeof value.mime === 'string'
      && typeof value.hash === 'string',
  );
}

function semantic(value) {
  if (Array.isArray(value)) return value.map(semantic);
  if (!value || typeof value !== 'object') return value;
  if (isMediaRecord(value)) {
    return {
      documentId: value.documentId ?? null,
      hash: value.hash ?? null,
      name: value.name ?? null,
      url: value.url ?? null,
      mime: value.mime ?? null,
      width: value.width ?? null,
      height: value.height ?? null,
    };
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SYSTEM_FIELDS.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, semantic(item)]),
  );
}

function pageWithoutWhyUs(page) {
  const copy = { ...page };
  delete copy.whyUs;
  // The scoped documents service intentionally does not populate SEO media,
  // while the public API snapshot does. Verify this field through the public
  // API separately instead of treating an API-shape difference as an edit.
  if (copy.seo && Object.hasOwn(copy.seo, 'ogImage')) {
    copy.seo = { ...copy.seo };
    delete copy.seo.ogImage;
  }
  return semantic(copy);
}

function publicApiPageUrl(locale, status) {
  return `${PUBLIC_STRAPI_ORIGIN}/api/career-page?locale=${encodeURIComponent(locale)}&status=${encodeURIComponent(status)}&populate[seo][populate]=*&populate[hero][populate]=backgroundImage&populate[workWithUs][populate]=*&populate[whyUs][populate][items][populate]=image`;
}

async function readPublicApiPage(locale, status) {
  const response = await fetch(publicApiPageUrl(locale, status));
  if (!response.ok) throw new Error(`Production career API returned HTTP ${response.status} for ${locale}/${status}.`);
  const body = await response.json();
  if (!body?.data) throw new Error(`Production career API returned no ${locale}/${status} data.`);
  return body.data;
}

async function readPublicApiPages() {
  const pages = {};
  for (const locale of LOCALES) {
    pages[locale] = {};
    for (const status of STATUSES) {
      pages[locale][status] = await readPublicApiPage(locale, status);
    }
  }
  return pages;
}

async function assertPublicApiUnrelated(snapshotPages) {
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      const before = snapshotPages[locale][status];
      const after = await readPublicApiPage(locale, status);
      const beforeCopy = { ...before };
      const afterCopy = { ...after };
      delete beforeCopy.whyUs;
      delete afterCopy.whyUs;
      if (checksum(semantic(beforeCopy)) !== checksum(semantic(afterCopy))) {
        throw new Error(`${locale}/${status} public career content outside whyUs changed.`);
      }
    }
  }
}

async function assertPublicApiTargeted(mediaByFile) {
  const pages = await readPublicApiPages();
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      if (!whyUsIsTargeted(pages[locale][status], locale, mediaByFile)) {
        throw new Error(`${locale}/${status} public career API does not contain the approved three-item target.`);
      }
    }
  }
  return pages;
}

function assertWhyUsShape(page, locale, status) {
  if (!page?.documentId) throw new Error(`Career page ${locale}/${status} is missing.`);
  if (!page.whyUs || !Array.isArray(page.whyUs.items)) {
    throw new Error(`Career page ${locale}/${status} has no whyUs items.`);
  }
  if (page.whyUs.items.length < 3) {
    throw new Error(`Career page ${locale}/${status} must have at least three existing whyUs items.`);
  }

  const expectedTitles = new Set(VALUES[locale].map(({ title }) => title));
  const seenTitles = new Set();
  for (const item of page.whyUs.items) {
    if (typeof item.title !== 'string' || !item.title.trim()) {
      throw new Error(`Career page ${locale}/${status} contains an item without a title.`);
    }
    if (seenTitles.has(item.title)) {
      throw new Error(`${locale}/${status} whyUs contains duplicate title ${JSON.stringify(item.title)}.`);
    }
    seenTitles.add(item.title);
  }
  for (const title of expectedTitles) {
    if (!seenTitles.has(title)) {
      throw new Error(`${locale}/${status} whyUs is missing expected title ${JSON.stringify(title)}.`);
    }
  }
  const extras = page.whyUs.items.filter((item) => !expectedTitles.has(item.title));
  if (extras.length > 1 || (extras.length === 1 && extras[0].title !== REMOVED_TITLES[locale])) {
    throw new Error(
      `${locale}/${status} whyUs contains an unexpected item; refusing to remove anything except `
      + `${JSON.stringify(REMOVED_TITLES[locale])}.`,
    );
  }
}

function approvedDescriptionsFromReport(report, sourcePath) {
  if (report?.format !== 'works-career-values-three-update-report-v1') {
    throw new Error(`Approved dev report ${sourcePath} has an unsupported format.`);
  }
  const result = {};
  for (const locale of LOCALES) {
    const items = report.afterDraft?.[locale]?.items;
    if (!Array.isArray(items) || items.length !== VALUES[locale].length) {
      throw new Error(`Approved dev report ${sourcePath} has no exact three-item ${locale} result.`);
    }
    const expectedTitles = VALUES[locale].map(({ title }) => title);
    if (items.map(({ title }) => title).some((title, index) => title !== expectedTitles[index])) {
      throw new Error(`Approved dev report ${sourcePath} has an unexpected ${locale} title/order.`);
    }
    result[locale] = new Map(items.map((item) => [item.title, item.description ?? '']));
  }
  return result;
}

function approvedDescriptionsFromSnapshot(snapshot, sourcePath) {
  if (snapshot?.format !== 'works-career-values-before-v1') {
    throw new Error(`Approved dev snapshot ${sourcePath} has an unsupported format.`);
  }
  const result = {};
  for (const locale of LOCALES) {
    const items = snapshot.locales?.[locale]?.whyUs?.items;
    if (!Array.isArray(items)) {
      throw new Error(`Approved dev snapshot ${sourcePath} has no ${locale} values.`);
    }
    const byTitle = new Map(items.map((item) => [item.title, item.description ?? '']));
    for (const title of VALUES[locale].map(({ title }) => title)) {
      if (!byTitle.has(title)) {
        throw new Error(`Approved dev snapshot ${sourcePath} is missing ${locale} title ${title}.`);
      }
    }
    result[locale] = byTitle;
  }
  return result;
}

async function loadApprovedDescriptions(sourcePath = APPROVED_DEV_REPORT_PATH) {
  let report;
  try {
    report = JSON.parse(await fsp.readFile(sourcePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT' || process.env.APPROVED_DEV_VALUES_REPORT) {
      throw new Error(`Cannot read approved dev career-values report ${sourcePath}: ${error.message}.`);
    }
    let snapshot;
    try {
      snapshot = JSON.parse(await fsp.readFile(APPROVED_DEV_SNAPSHOT_PATH, 'utf8'));
    } catch (snapshotError) {
      throw new Error(
        `Cannot read approved dev report ${sourcePath} or snapshot `
        + `${APPROVED_DEV_SNAPSHOT_PATH}: ${snapshotError.message}.`,
      );
    }
    return {
      sourcePath: APPROVED_DEV_SNAPSHOT_PATH,
      descriptions: approvedDescriptionsFromSnapshot(snapshot, APPROVED_DEV_SNAPSHOT_PATH),
    };
  }
  return {
    sourcePath,
    descriptions: approvedDescriptionsFromReport(report, sourcePath),
  };
}

function assertApprovedDescriptions(pages, approved, phase = 'production preflight') {
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      const seenTitles = new Set();
      for (const item of pages[locale][status].whyUs.items) {
        seenTitles.add(item.title);
        const expected = approved[locale].get(item.title);
        if (expected === undefined) {
          if (item.title === REMOVED_TITLES[locale]) continue;
          throw new Error(`${phase}: ${locale}/${status} has no approved description for ${item.title}.`);
        }
        const actual = item.description ?? '';
        if (actual !== expected) {
          throw new Error(
            `${phase}: ${locale}/${status} description differs from the approved dev report for `
            + `${JSON.stringify(item.title)}.`,
          );
        }
      }
      for (const title of VALUES[locale].map(({ title }) => title)) {
        if (!seenTitles.has(title)) {
          throw new Error(`${phase}: ${locale}/${status} is missing approved title ${title}.`);
        }
      }
    }
  }
}

async function readCareerPages(strapi) {
  const documents = strapi.documents(CAREER_UID);
  const pages = {};
  for (const locale of LOCALES) {
    pages[locale] = {};
    for (const status of STATUSES) {
      const records = await documents.findMany({
        locale,
        status,
        populate: PAGE_POPULATE,
      });
      if (records.length !== 1) {
        throw new Error(`Expected exactly one ${locale}/${status} career page, found ${records.length}.`);
      }
      pages[locale][status] = records[0];
      assertWhyUsShape(records[0], locale, status);
    }
    if (pages[locale].draft.documentId !== pages[locale].published.documentId) {
      throw new Error(`Career page ${locale} draft/published document IDs differ.`);
    }
  }
  if (
    pages.hu.draft.documentId !== pages.en.draft.documentId
    || pages.hu.published.documentId !== pages.en.published.documentId
  ) {
    throw new Error('HU and EN career pages do not share one document ID.');
  }
  return pages;
}

async function loadSnapshotPages(snapshotDir) {
  const result = {};
  for (const locale of LOCALES) {
    result[locale] = {};
    for (const status of STATUSES) {
      const filename = path.join(snapshotDir, `${locale}-${status}.json`);
      const body = JSON.parse(await fsp.readFile(filename, 'utf8'));
      if (!body?.data) throw new Error(`Snapshot ${filename} has no data.`);
      result[locale][status] = body.data;
    }
  }
  return result;
}

async function loadSnapshotBundle(snapshotDir) {
  const manifestPath = path.join(snapshotDir, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Snapshot ${snapshotDir} is not a v2 production snapshot; use a new empty directory `
      + `(${error.code === 'ENOENT' ? 'manifest.json is missing' : error.message}).`,
    );
  }
  if (manifest?.format !== 'works-career-values-production-snapshot-v2') {
    throw new Error(`Snapshot ${manifestPath} has an unsupported format.`);
  }
  const pages = await loadSnapshotPages(snapshotDir);
  let media;
  try {
    media = JSON.parse(await fsp.readFile(path.join(snapshotDir, 'media.json'), 'utf8'));
  } catch (error) {
    throw new Error(`Snapshot ${snapshotDir} has no media inventory: ${error.message}.`);
  }
  if (!Array.isArray(media?.data)) {
    throw new Error(`Snapshot ${snapshotDir}/media.json has no media inventory.`);
  }
  if (manifest.mediaChecksum !== checksum(semantic(media.data))) {
    throw new Error(`Snapshot ${snapshotDir} media inventory checksum is invalid.`);
  }
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      const expected = manifest.pageChecksums?.[locale]?.[status];
      if (!expected || expected !== checksum(semantic(pages[locale][status]))) {
        throw new Error(`Snapshot ${snapshotDir} checksum is invalid for ${locale}/${status}.`);
      }
    }
  }
  return { manifest, pages, media: media.data };
}

async function writeSnapshot(snapshotDir, publicPages, mediaInventory) {
  await fsp.mkdir(snapshotDir, { recursive: true });
  const entries = await fsp.readdir(snapshotDir);
  if (entries.length > 0) {
    return { ...(await loadSnapshotBundle(snapshotDir)), reused: true };
  }

  const pageChecksums = {};
  for (const locale of LOCALES) {
    pageChecksums[locale] = {};
    for (const status of STATUSES) {
      const filename = path.join(snapshotDir, `${locale}-${status}.json`);
      pageChecksums[locale][status] = checksum(semantic(publicPages[locale][status]));
      await fsp.writeFile(
        filename,
        `${JSON.stringify({ data: publicPages[locale][status] }, null, 2)}\n`,
        { mode: 0o600, flag: 'wx' },
      );
    }
  }
  await fsp.writeFile(
    path.join(snapshotDir, 'media.json'),
    `${JSON.stringify({ data: mediaInventory }, null, 2)}\n`,
    { mode: 0o600, flag: 'wx' },
  );
  const manifest = {
    format: 'works-career-values-production-snapshot-v2',
    createdAt: new Date().toISOString(),
    locales: LOCALES,
    statuses: STATUSES,
    pageChecksums,
    mediaChecksum: checksum(semantic(mediaInventory)),
  };
  await fsp.writeFile(
    path.join(snapshotDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o600, flag: 'wx' },
  );
  return { manifest, pages: publicPages, media: mediaInventory, reused: false };
}

function assertSnapshotUnrelated(snapshotPages, currentPages) {
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      const before = snapshotPages[locale][status];
      const after = currentPages[locale][status];
      if (checksum(pageWithoutWhyUs(before)) !== checksum(pageWithoutWhyUs(after))) {
        throw new Error(`${locale}/${status} career content outside whyUs changed since the snapshot.`);
      }
    }
  }
}

function assertDraftPublishedUnrelatedMatch(pages, phase) {
  for (const locale of LOCALES) {
    const draftChecksum = checksum(pageWithoutWhyUs(pages[locale].draft));
    const publishedChecksum = checksum(pageWithoutWhyUs(pages[locale].published));
    if (draftChecksum !== publishedChecksum) {
      throw new Error(
        `${phase}: ${locale} draft/published content outside whyUs differs; `
        + 'refusing to publish pending unrelated draft edits.',
      );
    }
  }
}

function assertInitialInvariants(beforePages) {
  for (const locale of LOCALES) {
    const draft = beforePages[locale].draft;
    const published = beforePages[locale].published;
    if ((draft.whyUs.sectionHeading ?? null) !== (published.whyUs.sectionHeading ?? null)) {
      throw new Error(`${locale} draft/published whyUs heading differs; refusing to overwrite either value.`);
    }
    if (draft.whyUs.items.length !== published.whyUs.items.length) {
      throw new Error(`${locale} draft/published whyUs item counts differ; refusing to overwrite either value.`);
    }
    const draftByTitle = new Map(draft.whyUs.items.map((item) => [item.title, item]));
    const publishedByTitle = new Map(published.whyUs.items.map((item) => [item.title, item]));
    for (const item of draft.whyUs.items) {
      const publishedItem = publishedByTitle.get(item.title);
      if (!publishedItem || (item.description ?? '') !== (publishedItem.description ?? '')) {
        throw new Error(
          `${locale} draft/published description for ${JSON.stringify(item.title)} differs; `
          + 'refusing to overwrite either value.',
        );
      }
    }
    for (const title of VALUES[locale].map(({ title }) => title)) {
      if (!draftByTitle.has(title) || !publishedByTitle.has(title)) {
        throw new Error(`${locale} draft/published pages do not contain the same approved titles.`);
      }
    }
  }
}

function assertTargetedStatePreservesSnapshot(snapshotPages, currentPages) {
  for (const locale of LOCALES) {
    const baseline = snapshotPages[locale].draft;
    const current = currentPages[locale].draft;
    if (current.whyUs.sectionHeading !== baseline.whyUs.sectionHeading) {
      throw new Error(`${locale} whyUs heading changed from the approved snapshot.`);
    }
    const baselineByTitle = new Map(baseline.whyUs.items.map((item) => [item.title, item]));
    const currentByTitle = new Map(current.whyUs.items.map((item) => [item.title, item]));
    for (const title of VALUES[locale].map(({ title }) => title)) {
      if ((currentByTitle.get(title)?.description ?? '') !== (baselineByTitle.get(title)?.description ?? '')) {
        throw new Error(`${locale} ${title} description changed from the approved snapshot.`);
      }
    }
  }
}

function makeWhyUsPayload(page, locale, mediaIds) {
  const existingItems = new Map(page.whyUs.items.map((item) => [item.title, item]));
  return {
    sectionHeading: page.whyUs.sectionHeading ?? null,
    items: VALUES[locale].map((value, index) => ({
      // Strapi v5 replaces the whole component. Find descriptions by title so
      // a reorder cannot silently attach a description to another value.
      title: existingItems.get(value.title).title,
      description: existingItems.get(value.title).description ?? null,
      image: mediaIds[index],
    })),
  };
}

function whyUsIsTargeted(page, locale, mediaByFile) {
  if (!page?.whyUs || page.whyUs.items?.length !== VALUES[locale].length) return false;
  return page.whyUs.items.every((item, index) => {
    const definition = VALUES[locale][index];
    const media = mediaByFile.get(definition.file);
    return item.title === definition.title
      && media
      && (item.image?.id === media.id || item.image?.documentId === media.documentId)
      && item.image?.url === media.url;
  });
}

function expectedMediaData(definition) {
  return {
    name: definition.name,
    alternativeText: definition.alternativeText,
    caption: '',
    focalPoint: null,
    width: definition.width,
    height: definition.height,
    formats: definition.formats,
    hash: definition.hash,
    ext: definition.ext,
    mime: definition.mime,
    size: definition.size,
    url: definition.url,
    previewUrl: null,
    provider: 'local',
    provider_metadata: null,
    folderPath: '/',
    publishedAt: new Date(),
  };
}

function assertMediaRecord(record, definition) {
  if (!record?.id) throw new Error(`Media record for ${definition.file} has no ID.`);
  if (typeof record.documentId !== 'string' || !record.documentId) {
    throw new Error(`Media record ${definition.file} has no generated production document ID.`);
  }
  for (const key of ['name', 'alternativeText', 'hash', 'ext', 'mime', 'url', 'provider']) {
    if (record[key] !== definition[key]) {
      throw new Error(`Media record ${definition.file} field ${key} is not exact.`);
    }
  }
  if (record.width !== definition.width || record.height !== definition.height) {
    throw new Error(`Media record ${definition.file} dimensions are not exact.`);
  }
  if (Number(record.size) !== definition.size) {
    throw new Error(`Media record ${definition.file} size is not exact.`);
  }
  if (checksum(record.formats || {}) !== checksum(definition.formats)) {
    throw new Error(`Media record ${definition.file} formats are not exact.`);
  }
  if ((record.caption ?? '') !== '') {
    throw new Error(`Media record ${definition.file} caption is not empty.`);
  }
}

async function findExistingMedia(strapi, definition) {
  const query = strapi.db.query('plugin::upload.file');
  const byName = await query.findMany({ where: { name: definition.name } });
  const byHash = await query.findMany({ where: { hash: definition.hash } });
  const byUrl = await query.findMany({ where: { url: definition.url } });
  const exact = [...byName, ...byHash, ...byUrl]
    .filter((record, index, records) => records.findIndex((item) => item.id === record.id) === index);

  if (exact.length > 1) {
    const matches = exact.filter(
      (record) => record.name === definition.name
        && record.hash === definition.hash
        && record.url === definition.url,
    );
    if (matches.length !== 1) {
      throw new Error(`Ambiguous existing production media for ${definition.file}.`);
    }
    assertMediaRecord(matches[0], definition);
    return matches[0];
  }
  if (exact.length === 1) {
    assertMediaRecord(exact[0], definition);
    return exact[0];
  }
  if (byName.length || byHash.length || byUrl.length) {
    throw new Error(`Conflicting production media record exists for ${definition.file}.`);
  }
  return null;
}

async function registerMedia(strapi, definition) {
  const query = strapi.db.query('plugin::upload.file');
  // The three originals and nine variants are committed and already seeded in
  // Railway's persistent uploads volume. Register those exact provider-local
  // paths instead of calling upload(), which would write files only to this
  // runner's local filesystem and could produce unavailable random URLs.
  const created = await query.create({ data: expectedMediaData(definition) });
  const record = await query.findOne({ where: { id: created.id } });
  assertMediaRecord(record, definition);
  return record;
}

async function readMediaInventory(strapi) {
  const query = strapi.db.query('plugin::upload.file');
  const records = await query.findMany({});
  return records
    .map(mediaInventoryEntry)
    .sort((left, right) => left.id - right.id);
}

function mediaInventoryEntry(record) {
  return { id: record.id, ...semantic(record) };
}

function assertMediaInventoryUnchanged(beforeInventory, afterInventory, allowedNewRecords = []) {
  const beforeById = new Map(beforeInventory.map((record) => [record.id, record]));
  const afterById = new Map(afterInventory.map((record) => [record.id, record]));
  for (const [id, before] of beforeById) {
    const after = afterById.get(id);
    if (!after) throw new Error(`Existing production media record ${id} disappeared.`);
    if (checksum(before) !== checksum(after)) {
      throw new Error(`Existing production media record ${id} changed unexpectedly.`);
    }
  }
  const allowedById = new Map(allowedNewRecords.map((record) => [record.id, record]));
  for (const [id, after] of afterById) {
    if (beforeById.has(id)) continue;
    const allowed = allowedById.get(id);
    if (!allowed) throw new Error(`Unexpected new production media record ${id}.`);
    if (checksum(allowed) !== checksum(after)) {
      throw new Error(`New production media record ${id} does not match its approved definition.`);
    }
  }
}

function makeRestoreWhyUsPayload(page) {
  return {
    sectionHeading: page.whyUs.sectionHeading ?? null,
    items: page.whyUs.items.map((item) => ({
      title: item.title,
      description: item.description ?? null,
      image: item.image?.id ?? null,
    })),
  };
}

function assertWhyUsMatches(expectedPages, currentPages, phase, statuses = STATUSES) {
  for (const locale of LOCALES) {
    for (const status of statuses) {
      const expected = expectedPages[locale][status]?.whyUs;
      const current = currentPages[locale][status]?.whyUs;
      if (checksum(semantic(expected)) !== checksum(semantic(current))) {
        throw new Error(`${phase}: ${locale}/${status} whyUs does not match the snapshot.`);
      }
    }
  }
}

function assertSnapshotDocumentIds(snapshotPages, currentPages) {
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      if (snapshotPages[locale][status].documentId !== currentPages[locale][status].documentId) {
        throw new Error(`Snapshot document ID mismatch for ${locale}/${status}; refusing restore.`);
      }
    }
  }
}

async function assertSnapshotMediaReferences(strapi, snapshotPages) {
  const references = new Map();
  for (const locale of LOCALES) {
    for (const status of STATUSES) {
      for (const item of snapshotPages[locale][status].whyUs.items) {
        const image = item.image;
        if (!image?.id) throw new Error(`Snapshot ${locale}/${status} contains an item without media.`);
        references.set(image.id, image);
      }
    }
  }
  const query = strapi.db.query('plugin::upload.file');
  for (const [id, expected] of references) {
    const record = await query.findOne({ where: { id } });
    if (!record) throw new Error(`Snapshot media record ${id} is missing; refusing restore.`);
    for (const key of ['documentId', 'hash', 'url']) {
      if ((record[key] ?? null) !== (expected[key] ?? null)) {
        throw new Error(`Snapshot media record ${id} ${key} differs; refusing restore.`);
      }
    }
  }
}

async function verifyResult(
  strapi,
  pages,
  snapshotPages,
  beforePages,
  definitions,
  mediaByFile,
  beforeMediaInventory,
) {
  await assertPublicApiUnrelated(snapshotPages);
  assertSnapshotUnrelated(snapshotPages, pages);
  for (const locale of LOCALES) {
    const expectedByTitle = new Map(
      beforePages[locale].draft.whyUs.items.map((item) => [item.title, item]),
    );
    for (const status of STATUSES) {
      const page = pages[locale][status];
      if (!whyUsIsTargeted(page, locale, mediaByFile)) {
        throw new Error(`${locale}/${status} whyUs does not contain the approved three-item target.`);
      }
      if (page.whyUs.sectionHeading !== beforePages[locale].draft.whyUs.sectionHeading) {
        throw new Error(`${locale}/${status} whyUs heading changed unexpectedly.`);
      }
      for (const item of page.whyUs.items) {
        if ((item.description ?? '') !== (expectedByTitle.get(item.title)?.description ?? '')) {
          throw new Error(`${locale}/${status} ${item.title} description changed unexpectedly.`);
        }
      }
    }
  }

  const afterMediaInventory = await readMediaInventory(strapi);
  const beforeIds = new Set(beforeMediaInventory.map((record) => record.id));
  const allowedNewRecords = [...mediaByFile.values()]
    .filter((record) => !beforeIds.has(record.id))
    .map(mediaInventoryEntry);
  assertMediaInventoryUnchanged(beforeMediaInventory, afterMediaInventory, allowedNewRecords);
  for (const definition of definitions) {
    const record = mediaByFile.get(definition.file);
    assertMediaRecord(record, definition);
    await verifyPublicAsset(definition.url, definition.sourceSha256, `${definition.file} original`);
    for (const format of definition.formatFiles) {
      await verifyPublicAsset(format.url, format.sha256, format.name);
    }
  }
}

async function writeReport(value) {
  await fsp.writeFile(REPORT_PATH, `${JSON.stringify(canonical(value), null, 2)}\n`, { mode: 0o600 });
}

async function restoreProduction(snapshotDir, snapshot) {
  if (process.env.PRODUCTION_RESTORE_CONFIRMATION !== 'RESTORE_CAREER_VALUES_SNAPSHOT') {
    throw new Error(
      'Refusing production restore: set PRODUCTION_RESTORE_CONFIRMATION='
      + 'RESTORE_CAREER_VALUES_SNAPSHOT for this explicit rollback command.',
    );
  }

  await withScopedStrapi(async (strapi) => {
    const beforePages = await readCareerPages(strapi);
    const beforeMediaInventory = await readMediaInventory(strapi);
    assertSnapshotDocumentIds(snapshot.pages, beforePages);
    assertSnapshotUnrelated(snapshot.pages, beforePages);
    assertDraftPublishedUnrelatedMatch(beforePages, 'Before restore');
    await assertSnapshotMediaReferences(strapi, snapshot.pages);
    await assertPublicApiUnrelated(snapshot.pages);

    await strapi.db.transaction(async () => {
      const documents = strapi.documents(CAREER_UID);
      const documentId = beforePages.hu.draft.documentId;
      for (const locale of LOCALES) {
        await documents.update({
          documentId,
          locale,
          status: 'draft',
          data: { whyUs: makeRestoreWhyUsPayload(snapshot.pages[locale].draft) },
        });
      }
    });

    const prePublishPages = await readCareerPages(strapi);
    assertSnapshotUnrelated(snapshot.pages, prePublishPages);
    assertDraftPublishedUnrelatedMatch(prePublishPages, 'Before restore publish');
    assertWhyUsMatches(snapshot.pages, prePublishPages, 'Restore draft verification', ['draft']);

    const documents = strapi.documents(CAREER_UID);
    const documentId = beforePages.hu.draft.documentId;
    for (const locale of LOCALES) {
      await documents.publish({ documentId, locale });
    }

    const afterPages = await readCareerPages(strapi);
    assertSnapshotUnrelated(snapshot.pages, afterPages);
    assertWhyUsMatches(snapshot.pages, afterPages, 'Restore verification');
    const afterMediaInventory = await readMediaInventory(strapi);
    assertMediaInventoryUnchanged(beforeMediaInventory, afterMediaInventory);
    await assertPublicApiUnrelated(snapshot.pages);
    const publicAfterPages = await readPublicApiPages();
    assertWhyUsMatches(snapshot.pages, publicAfterPages, 'Public restore verification');

    await writeReport({
      format: 'works-career-values-production-restore-report-v1',
      restored: true,
      snapshotDir,
      locales: LOCALES,
      itemCount: snapshot.pages.hu.draft.whyUs.items.length,
      verification: {
        unrelatedCareerFieldsUnchanged: true,
        snapshotMediaReferencesPresent: true,
        existingMediaRetained: true,
        noMediaRowsChanged: true,
        publicApiRestored: true,
      },
    });
    console.info(JSON.stringify({
      restored: true,
      snapshotDir,
      locales: LOCALES,
      report: REPORT_PATH,
    }, null, 2));
  });
}

async function run() {
  assertSupportedRuntime();
  const args = parseArgs(process.argv.slice(2));
  assertProductionEnvironment();
  const snapshotDir = process.env.PRODUCTION_SNAPSHOT_DIR || DEFAULT_SNAPSHOT_DIR;
  if (args.restore) {
    const snapshot = await loadSnapshotBundle(snapshotDir);
    await restoreProduction(snapshotDir, snapshot);
    return;
  }
  const definitions = await prepareMediaDefinitions();

  // Verify every source and generated file through the public Railway origin
  // before opening the production database. A missing or mismatched seed is a
  // hard stop: this runner never creates a DB row for an unavailable asset.
  const seedChecks = await verifySeedFiles(definitions);

  await withScopedStrapi(async (strapi) => {
    const beforePages = await readCareerPages(strapi);
    const approvedDev = await loadApprovedDescriptions();
    assertDraftPublishedUnrelatedMatch(beforePages, 'Preflight');
    assertApprovedDescriptions(beforePages, approvedDev.descriptions);
    const beforeMediaInventory = await readMediaInventory(strapi);
    const currentPublicPages = await readPublicApiPages();
    const snapshot = await writeSnapshot(snapshotDir, currentPublicPages, beforeMediaInventory);
    const snapshotPages = snapshot.pages;
    await assertPublicApiUnrelated(snapshotPages);
    assertSnapshotUnrelated(snapshotPages, beforePages);

    const mediaByFile = new Map();
    const mediaActions = [];

    // Read existing records without writing anything. This keeps all safety
    // checks ahead of the first production mutation and makes a rerun after a
    // completed or partially completed attempt idempotent.
    for (const definition of definitions) {
      const record = await findExistingMedia(strapi, definition);
      if (record) mediaByFile.set(definition.file, record);
    }
    const snapshotMediaIds = new Set(snapshot.media.map((record) => record.id));
    const approvedMediaSinceSnapshot = [...mediaByFile.values()]
      .filter((record) => !snapshotMediaIds.has(record.id))
      .map(mediaInventoryEntry);
    assertMediaInventoryUnchanged(snapshot.media, beforeMediaInventory, approvedMediaSinceSnapshot);

    const draftTargeted = LOCALES.every(
      (locale) => whyUsIsTargeted(beforePages[locale].draft, locale, mediaByFile),
    );
    const publishedTargeted = LOCALES.every(
      (locale) => whyUsIsTargeted(beforePages[locale].published, locale, mediaByFile),
    );

    if (!args.apply) {
      assertDraftPublishedUnrelatedMatch(beforePages, 'Dry-run preflight');
      if (draftTargeted) {
        assertTargetedStatePreservesSnapshot(snapshotPages, beforePages);
      } else {
        assertInitialInvariants(beforePages);
      }
      await writeReport({
        format: 'works-career-values-production-update-v2',
        applied: false,
        locales: LOCALES,
        itemCount: VALUES.hu.length,
        snapshotDir,
        snapshotReused: snapshot.reused,
        approvedDevReport: approvedDev.sourcePath,
        media: definitions.map((definition) => ({
          file: definition.file,
          registered: mediaByFile.has(definition.file),
          url: definition.url,
          sourceSha256: definition.sourceSha256,
        })),
        seedChecks,
        verification: {
          noProductionWrites: true,
          preflightPassed: true,
          unrelatedCareerFieldsUnchanged: true,
          draftPublishedUnrelatedFieldsMatch: true,
          descriptionsByTitlePreserved: true,
          approvedDevDescriptionsMatch: true,
          allSeedUrlsSha256Verified: true,
          targetAlreadyApplied: draftTargeted && publishedTargeted,
        },
      });
      console.info(JSON.stringify({
        applied: false,
        preflightPassed: true,
        locales: LOCALES,
        itemCount: VALUES.hu.length,
        snapshotDir,
        report: REPORT_PATH,
        targetAlreadyApplied: draftTargeted && publishedTargeted,
        missingMedia: definitions
          .filter((definition) => !mediaByFile.has(definition.file))
          .map(({ file }) => file),
      }, null, 2));
      return;
    }

    if (draftTargeted && publishedTargeted) {
      assertTargetedStatePreservesSnapshot(snapshotPages, beforePages);
    } else {
      if (draftTargeted) {
        assertTargetedStatePreservesSnapshot(snapshotPages, beforePages);
      } else {
        assertInitialInvariants(beforePages);
        assertDraftPublishedUnrelatedMatch(beforePages, 'Before draft update');
      }
      await strapi.db.transaction(async () => {
        const documentId = beforePages.hu.draft.documentId;
        const documents = strapi.documents(CAREER_UID);
        for (const definition of definitions) {
          if (mediaByFile.has(definition.file)) continue;
          const record = await registerMedia(strapi, definition);
          mediaByFile.set(definition.file, record);
        }
        const mediaIds = VALUES.hu.map(({ file }) => mediaByFile.get(file).id);
        for (const locale of LOCALES) {
          await documents.update({
            documentId,
            locale,
            status: 'draft',
            data: {
              // Strapi v5 replaces the whole component. Passing every field
              // here prevents heading/descriptions/media loss.
              whyUs: makeWhyUsPayload(beforePages[locale].draft, locale, mediaIds),
            },
          });
        }
      });
    }

    for (const definition of definitions) {
      const record = mediaByFile.get(definition.file);
      if (!record) throw new Error(`Media record was not registered for ${definition.file}.`);
      mediaActions.push({
        file: definition.file,
        recordId: record.id,
        documentId: record.documentId,
        url: record.url,
        reused: beforeMediaInventory.some(({ id }) => id === record.id),
      });
    }

    // Publishing is deliberately outside the content transaction because
    // Strapi's document service owns the publication operation. Only missing
    // publication states are touched, which makes reruns idempotent.
    if (!publishedTargeted || !draftTargeted) {
      const documents = strapi.documents(CAREER_UID);
      const documentId = beforePages.hu.draft.documentId;
      const prePublishPages = await readCareerPages(strapi);
      assertSnapshotUnrelated(snapshotPages, prePublishPages);
      assertDraftPublishedUnrelatedMatch(prePublishPages, 'Before publish');
      assertApprovedDescriptions(prePublishPages, approvedDev.descriptions, 'Before publish');
      for (const locale of LOCALES) {
        if (!whyUsIsTargeted(prePublishPages[locale].draft, locale, mediaByFile)) {
          throw new Error(`${locale}/draft is not the exact approved target immediately before publish.`);
        }
        if (
          prePublishPages[locale].draft.whyUs.sectionHeading
          !== snapshotPages[locale].draft.whyUs.sectionHeading
        ) {
          throw new Error(`${locale}/draft whyUs heading changed before publish.`);
        }
      }
      for (const locale of LOCALES) {
        await documents.publish({ documentId, locale });
      }
    }

    const afterPages = await readCareerPages(strapi);
    await verifyResult(
      strapi,
      afterPages,
      snapshotPages,
      beforePages,
      definitions,
      mediaByFile,
      beforeMediaInventory,
    );
    await assertPublicApiTargeted(mediaByFile);
    await writeReport({
      format: 'works-career-values-production-update-v2',
      applied: true,
      locales: LOCALES,
      itemCount: VALUES.hu.length,
      snapshotDir,
      snapshotReused: snapshot.reused,
      approvedDevReport: approvedDev.sourcePath,
      mediaActions,
      seedChecks,
      verification: {
        unrelatedCareerFieldsUnchanged: true,
        draftPublishedUnrelatedFieldsMatchBeforePublish: true,
        descriptionsByTitlePreserved: true,
        approvedDevDescriptionsMatch: true,
        existingMediaRetained: true,
        noUnexpectedMediaRows: true,
        allSeedUrlsSha256Verified: true,
        publicApiTargetVerified: true,
        websiteRebuild: 'not-triggered-by-scoped-runner',
      },
    });
    console.info(JSON.stringify({
      applied: true,
      locales: LOCALES,
      itemCount: VALUES.hu.length,
      media: mediaActions,
      snapshotDir,
      report: REPORT_PATH,
      websiteRebuild: 'not-triggered-by-scoped-runner',
    }, null, 2));
  });
}

if (INVOKED_SCRIPT === SCRIPT_PATH) {
  run().catch((error) => {
    console.error(`Production career values update failed: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}

export {
  approvedDescriptionsFromReport,
  approvedDescriptionsFromSnapshot,
  assertApprovedDescriptions,
  assertSupportedRuntime,
  assertWhyUsShape,
  assertDraftPublishedUnrelatedMatch,
  makeWhyUsPayload,
  parseArgs,
  prepareMediaDefinitions,
  run,
};