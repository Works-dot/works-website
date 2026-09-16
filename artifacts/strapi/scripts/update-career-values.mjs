import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { withStrapi, canonical, checksum } from './translation-pipeline-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRAPI_ROOT = path.resolve(__dirname, '..');
const ATTACHED_ASSETS = path.resolve(STRAPI_ROOT, '..', '..', 'attached_assets');
const SNAPSHOT_DIR = path.join(STRAPI_ROOT, '.tmp');
const BEFORE_SNAPSHOT = path.join(SNAPSHOT_DIR, 'career-values-three-before.json');
const REPORT_PATH = path.join(SNAPSHOT_DIR, 'career-values-three-report.json');
const CAREER_UID = 'api::career-page.career-page';
const LOCALES = ['hu', 'en'];
const DOCUMENT_STATUS = 'draft';
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
    { title: 'Együttműködés', file: 'egyuttmukodes-new_1789551061820.png' },
    { title: 'Alkalmazkodás', file: 'alkalmazkodas-new_1789551061821.png' },
    { title: 'Empátia', file: 'empatia-new_1789551061821.png' },
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

const PAGE_POPULATE = {
  seo: { populate: ['*'] },
  hero: { populate: ['backgroundImage'] },
  workWithUs: { populate: ['*'] },
  whyUs: { populate: { items: { populate: ['image'] } } },
};

function parseArgs(argv) {
  const args = new Set(argv);
  for (const arg of argv) {
    if (arg !== '--apply' && arg !== '--dry-run') {
      throw new Error(`Unknown argument ${arg}. Use --dry-run or --apply.`);
    }
  }
  if (args.has('--apply') && args.has('--dry-run')) {
    throw new Error('Choose exactly one of --dry-run or --apply.');
  }
  return { apply: args.has('--apply') };
}

function databaseIdentity(value) {
  const url = new URL(value);
  return [
    url.hostname.toLowerCase(),
    url.port || '5432',
    decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, ''),
  ].join('|');
}

function assertDevelopmentOnly() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Refusing career values update unless NODE_ENV=development.');
  }
  const databaseUrl = process.env.STRAPI_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('STRAPI_DATABASE_URL or DATABASE_URL is required.');
  }
  if (!process.env.PRODUCTION_DATABASE_URL) {
    throw new Error('PRODUCTION_DATABASE_URL is required to verify database isolation.');
  }
  if (databaseIdentity(databaseUrl) === databaseIdentity(process.env.PRODUCTION_DATABASE_URL)) {
    throw new Error('Refusing career values update: target database identity matches production.');
  }
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function pngAlphaInfo(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Expected a PNG source image.');
  }

  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const imageData = [];
  let hasTransparencyChunk = false;

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = buffer.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      imageData.push(data);
    } else if (type === 'tRNS') {
      hasTransparencyChunk = true;
    } else if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  const hasAlpha = colorType === 4 || colorType === 6 || hasTransparencyChunk;
  const result = {
    width,
    height,
    bitDepth,
    colorType,
    interlace,
    hasAlpha,
    alphaMin: null,
    alphaMax: null,
    transparentPixels: null,
  };

  if (!hasAlpha || colorType !== 6 || bitDepth !== 8 || interlace !== 0) {
    return result;
  }

  const inflated = zlib.inflateSync(Buffer.concat(imageData));
  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  const pixels = Buffer.alloc(height * rowBytes);
  let inputOffset = 0;
  let previousRow = Buffer.alloc(rowBytes);
  let alphaMin = 255;
  let alphaMax = 0;
  let transparentPixels = 0;

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[inputOffset];
    inputOffset += 1;
    const encoded = inflated.subarray(inputOffset, inputOffset + rowBytes);
    inputOffset += rowBytes;
    const decoded = Buffer.alloc(rowBytes);

    for (let index = 0; index < rowBytes; index += 1) {
      const left = index >= bytesPerPixel ? decoded[index - bytesPerPixel] : 0;
      const above = previousRow[index] || 0;
      const upperLeft = index >= bytesPerPixel ? previousRow[index - bytesPerPixel] || 0 : 0;
      let value = encoded[index];
      if (filter === 1) value = (value + left) & 0xff;
      else if (filter === 2) value = (value + above) & 0xff;
      else if (filter === 3) value = (value + Math.floor((left + above) / 2)) & 0xff;
      else if (filter === 4) {
        const estimate = left + above - upperLeft;
        const pa = Math.abs(estimate - left);
        const pb = Math.abs(estimate - above);
        const pc = Math.abs(estimate - upperLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? above : upperLeft;
        value = (value + predictor) & 0xff;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG row filter ${filter}.`);
      }
      decoded[index] = value;
    }

    decoded.copy(pixels, row * rowBytes);
    previousRow = decoded;
  }

  for (let index = 3; index < pixels.length; index += 4) {
    const alpha = pixels[index];
    alphaMin = Math.min(alphaMin, alpha);
    alphaMax = Math.max(alphaMax, alpha);
    if (alpha === 0) transparentPixels += 1;
  }
  result.alphaMin = alphaMin;
  result.alphaMax = alphaMax;
  result.transparentPixels = transparentPixels;
  return result;
}

function mediaSemantic(media) {
  if (!media) return null;
  if (Array.isArray(media)) return media.map(mediaSemantic);
  return {
    documentId: media.documentId ?? null,
    hash: media.hash ?? null,
    name: media.name ?? null,
    url: media.url ?? null,
    mime: media.mime ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
  };
}

function semantic(value, key = '') {
  if (Array.isArray(value)) return value.map((item) => semantic(item));
  if (!value || typeof value !== 'object') return value;
  if (key === 'image' || key === 'backgroundImage') return mediaSemantic(value);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([name]) => !SYSTEM_FIELDS.has(name))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, item]) => [name, semantic(item, name)]),
  );
}

function whyUsSemantic(whyUs) {
  if (!whyUs) return null;
  return {
    sectionHeading: whyUs.sectionHeading ?? null,
    items: (whyUs.items || []).map((item) => ({
      title: item.title ?? null,
      description: item.description ?? null,
      image: mediaSemantic(item.image),
    })),
  };
}

function pageWithoutWhyUs(page) {
  const copy = { ...page };
  delete copy.whyUs;
  return semantic(copy);
}

function filePathForRecord(record) {
  if (!record?.url || record.provider !== 'local') return null;
  return path.join(STRAPI_ROOT, 'public', record.url.replace(/^\/+/, ''));
}

async function findExistingMedia(strapi, filename, sourceBuffer) {
  const byName = await strapi.db.query('plugin::upload.file').findMany({
    where: { name: filename },
  });
  for (const record of byName) {
    const storedPath = filePathForRecord(record);
    if (storedPath && fs.existsSync(storedPath)) {
      const stored = await fsp.readFile(storedPath);
      if (stored.equals(sourceBuffer)) return { record, reused: true, needsOriginalRepair: false };
      // Strapi may have optimized an original PNG during a previous
      // interrupted attempt. The exact filename, MIME type, dimensions and
      // local provider identify that partial upload without touching an
      // unrelated media record.
      if (
        record.provider === 'local'
        && record.mime === 'image/png'
        && record.width === EXPECTED_IMAGE_DIMENSIONS.width
        && record.height === EXPECTED_IMAGE_DIMENSIONS.height
      ) {
        return { record, reused: true, needsOriginalRepair: true };
      }
    }
  }
  if (byName.length) {
    throw new Error(`A different media file already uses the required name ${filename}.`);
  }

  // Protect against a partially completed earlier run that used a different
  // filename while still avoiding an unnecessary second upload. Strapi's
  // upload file model stores a rounded KB size, so compare bytes on disk.
  const allFiles = await strapi.db.query('plugin::upload.file').findMany();
  for (const record of allFiles) {
    const storedPath = filePathForRecord(record);
    if (!storedPath || !fs.existsSync(storedPath)) continue;
    const stored = await fsp.readFile(storedPath);
    if (stored.equals(sourceBuffer)) return { record, reused: true, needsOriginalRepair: false };
  }
  return null;
}

async function uploadMedia(strapi, definition) {
  const sourcePath = path.join(ATTACHED_ASSETS, definition.file);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing attached asset ${sourcePath}.`);
  const sourceBuffer = await fsp.readFile(sourcePath);
  const sourceHash = sha256(sourceBuffer);
  const alpha = pngAlphaInfo(sourceBuffer);
  if (
    alpha.width !== EXPECTED_IMAGE_DIMENSIONS.width
    || alpha.height !== EXPECTED_IMAGE_DIMENSIONS.height
  ) {
    throw new Error(
      `${definition.file} dimensions are ${alpha.width}x${alpha.height}; `
      + `expected ${EXPECTED_IMAGE_DIMENSIONS.width}x${EXPECTED_IMAGE_DIMENSIONS.height}.`,
    );
  }
  const existing = await findExistingMedia(strapi, definition.file, sourceBuffer);
  let record;
  let reused = false;
  let needsOriginalRepair = false;

  if (existing) {
    ({ record, reused, needsOriginalRepair } = existing);
    needsOriginalRepair ||= record.width !== alpha.width || record.height !== alpha.height;
  } else {
    const uploaded = await strapi.plugin('upload').service('upload').upload({
      data: {
        fileInfo: {
          name: definition.file,
          alternativeText: definition.title,
          caption: '',
        },
      },
      files: {
        filepath: sourcePath,
        originalFilename: definition.file,
        mimetype: 'image/png',
        size: sourceBuffer.length,
      },
    });
    record = uploaded?.[0];
    if (!record?.id) throw new Error(`Strapi upload returned no record for ${definition.file}.`);
    // The development upload settings may optimize the primary PNG. Restore
    // the exact attached original after the established upload service has
    // created the media record and all generated formats.
    needsOriginalRepair = true;
  }

  const storedPath = filePathForRecord(record);
  if (!storedPath || !fs.existsSync(storedPath)) {
    throw new Error(`Cannot verify original bytes for uploaded media ${definition.file}.`);
  }
  if (needsOriginalRepair) {
    await fsp.copyFile(sourcePath, storedPath);
    await strapi.db.query('plugin::upload.file').update({
      where: { id: record.id },
      data: {
        size: sourceBuffer.length / 1000,
        width: alpha.width,
        height: alpha.height,
      },
    });
    record = await strapi.db.query('plugin::upload.file').findOne({
      where: { id: record.id },
    });
  }
  const storedBuffer = await fsp.readFile(storedPath);
  const storedHash = sha256(storedBuffer);
  if (!storedBuffer.equals(sourceBuffer)) {
    throw new Error(`Uploaded original bytes changed for ${definition.file}.`);
  }
  if (
    record.width !== alpha.width
    || record.height !== alpha.height
  ) {
    throw new Error(`Media metadata dimensions changed for ${definition.file}.`);
  }

  return {
    id: record.id,
    documentId: record.documentId ?? null,
    name: record.name,
    url: record.url,
    sourceBytes: sourceBuffer.length,
    sourceSha256: sourceHash,
    storedBytes: storedBuffer.length,
    storedSha256: storedHash,
    bytesIdentical: true,
    reused,
    alpha,
    width: record.width,
    height: record.height,
  };
}

function assertWhyUsShape(page, locale) {
  if (!page?.documentId) throw new Error(`Career page ${locale} document is missing.`);
  if (!page.whyUs) throw new Error(`Career page ${locale} has no whyUs component.`);
  if (!Array.isArray(page.whyUs.items) || page.whyUs.items.length < 3) {
    throw new Error(`Career page ${locale} must have at least three existing whyUs items.`);
  }

  const expectedTitles = new Set(VALUES[locale].map(({ title }) => title));
  const seenTitles = new Set();
  for (const item of page.whyUs.items) {
    if (seenTitles.has(item.title)) {
      throw new Error(`${locale} whyUs contains duplicate title ${JSON.stringify(item.title)}.`);
    }
    seenTitles.add(item.title);
  }
  for (const title of expectedTitles) {
    if (!seenTitles.has(title)) {
      throw new Error(`${locale} whyUs is missing expected title ${JSON.stringify(title)}.`);
    }
  }
  const extras = page.whyUs.items.filter((item) => !expectedTitles.has(item.title));
  if (extras.length > 1 || (extras.length === 1 && extras[0].title !== REMOVED_TITLES[locale])) {
    throw new Error(
      `${locale} whyUs contains an unexpected item; refusing to remove anything except `
      + `${JSON.stringify(REMOVED_TITLES[locale])}.`,
    );
  }
}

function makeWhyUsPayload(page, locale, mediaIds) {
  const existingItems = new Map(page.whyUs.items.map((item) => [item.title, item]));
  return {
    sectionHeading: page.whyUs.sectionHeading ?? null,
    items: VALUES[locale].map((value, index) => ({
      // Use the existing item by title rather than by index: the requested
      // reorder must not silently move a description to a different value.
      title: existingItems.get(value.title).title,
      description: existingItems.get(value.title).description ?? null,
      image: mediaIds[index],
    })),
  };
}

function compareEqual(label, before, after) {
  const beforeChecksum = checksum(before);
  const afterChecksum = checksum(after);
  if (beforeChecksum !== afterChecksum) {
    throw new Error(`${label} changed unexpectedly (${beforeChecksum} -> ${afterChecksum}).`);
  }
  return { label, unchanged: true, checksum: beforeChecksum };
}

async function readCareerPages(strapi, documentId) {
  const documents = strapi.documents(CAREER_UID);
  const pages = {};
  for (const locale of LOCALES) {
    pages[locale] = await documents.findOne({
      documentId,
      locale,
      status: DOCUMENT_STATUS,
      populate: PAGE_POPULATE,
    });
    assertWhyUsShape(pages[locale], locale);
  }
  return pages;
}

async function assertTrackedMediaUnchanged(strapi, beforePages) {
  const ids = new Set();
  for (const locale of LOCALES) {
    for (const item of beforePages[locale].whyUs.items) {
      if (item.image?.id) ids.add(item.image.id);
    }
  }
  const query = strapi.db.query('plugin::upload.file');
  for (const id of ids) {
    const record = await query.findOne({ where: { id } });
    if (!record) throw new Error(`Existing media record ${id} disappeared.`);
  }
}

async function readBeforeReport() {
  const snapshot = JSON.parse(await fsp.readFile(BEFORE_SNAPSHOT, 'utf8'));
  return Object.fromEntries(LOCALES.map((locale) => [
    locale,
    {
      sectionHeading: snapshot.locales[locale].whyUs.sectionHeading,
      items: snapshot.locales[locale].whyUs.items,
    },
  ]));
}

await (async () => {
  const args = parseArgs(process.argv.slice(2));
  assertDevelopmentOnly();
  await fsp.mkdir(SNAPSHOT_DIR, { recursive: true });

  await withStrapi(async (strapi) => {
    const documents = strapi.documents(CAREER_UID);
    const huPages = await documents.findMany({
      locale: 'hu',
      status: DOCUMENT_STATUS,
      populate: PAGE_POPULATE,
    });
    if (huPages.length !== 1) {
      throw new Error(`Expected exactly one HU career page draft, found ${huPages.length}.`);
    }
    const documentId = huPages[0].documentId;
    const beforePages = await readCareerPages(strapi, documentId);
    const before = {
      format: 'works-career-values-before-v1',
      documentId,
      locales: Object.fromEntries(LOCALES.map((locale) => [
        locale,
        {
          whyUs: whyUsSemantic(beforePages[locale].whyUs),
          unrelated: pageWithoutWhyUs(beforePages[locale]),
        },
      ])),
    };

    if (!fs.existsSync(BEFORE_SNAPSHOT)) {
      await fsp.writeFile(BEFORE_SNAPSHOT, `${JSON.stringify(before, null, 2)}\n`);
      console.info(`Saved before snapshot: ${BEFORE_SNAPSHOT}`);
    } else {
      console.info(`Before snapshot already exists; preserving it: ${BEFORE_SNAPSHOT}`);
    }

    if (!args.apply) {
      console.info('Dry-run complete; no media or content writes were made.');
      return;
    }

    const media = {};
    for (const definition of VALUES.hu) {
      media[definition.file] = await uploadMedia(strapi, definition);
    }
    const mediaIds = VALUES.hu.map(({ file }) => media[file].id);

    await strapi.db.transaction(async () => {
      for (const locale of LOCALES) {
        const page = beforePages[locale];
        await documents.update({
          documentId,
          locale,
          status: DOCUMENT_STATUS,
          data: {
            // Strapi v5 replaces the whole component. Every component
            // field, including media ids, is deliberately passed back.
            whyUs: makeWhyUsPayload(page, locale, mediaIds),
          },
        });
      }
    });

    for (const locale of LOCALES) {
      await documents.publish({ documentId, locale });
    }

    const afterDraftPages = await readCareerPages(strapi, documentId);
    const unchanged = LOCALES.map((locale) => compareEqual(
      `${locale} unrelated career page content`,
      pageWithoutWhyUs(beforePages[locale]),
      pageWithoutWhyUs(afterDraftPages[locale]),
    ));

    for (const locale of LOCALES) {
      const beforeItems = beforePages[locale].whyUs.items;
      const afterWhyUs = afterDraftPages[locale].whyUs;
      if (afterWhyUs.sectionHeading !== beforePages[locale].whyUs.sectionHeading) {
        throw new Error(`${locale} whyUs section heading changed unexpectedly.`);
      }
      if (afterWhyUs.items.length !== 3) {
        throw new Error(`${locale} whyUs must contain exactly three items after update.`);
      }
      const beforeByTitle = new Map(beforeItems.map((item) => [item.title, item]));
      for (let index = 0; index < VALUES[locale].length; index += 1) {
        const expectedTitle = VALUES[locale][index].title;
        const beforeItem = beforeByTitle.get(expectedTitle);
        const afterItem = afterWhyUs.items[index];
        if (afterItem.title !== beforeItem.title) {
          throw new Error(`${locale} item ${index + 1} title changed unexpectedly.`);
        }
        if (afterItem.description !== beforeItem.description) {
          throw new Error(`${locale} ${expectedTitle} description changed unexpectedly.`);
        }
      }
      const removed = beforeItems.filter(
        (item) => item.title === REMOVED_TITLES[locale],
      );
      if (
        (beforeItems.length === 4 && removed.length !== 1)
        || (beforeItems.length === 3 && removed.length !== 0)
      ) {
        throw new Error(`${locale} expected exactly one removed Purposefulness item.`);
      }
    }
    await assertTrackedMediaUnchanged(strapi, beforePages);

    const report = {
      format: 'works-career-values-three-update-report-v1',
      applied: args.apply,
      documentId,
      beforeSnapshot: BEFORE_SNAPSHOT,
      before: await readBeforeReport(),
      afterDraft: Object.fromEntries(LOCALES.map((locale) => [
        locale,
        {
          sectionHeading: afterDraftPages[locale].whyUs.sectionHeading,
          items: afterDraftPages[locale].whyUs.items.map((item) => ({
            title: item.title,
            description: item.description ?? null,
            image: mediaSemantic(item.image),
          })),
        },
      ])),
      media,
      unchanged,
    };
    await fsp.writeFile(REPORT_PATH, `${JSON.stringify(canonical(report), null, 2)}\n`);
    console.info(`${args.apply ? 'Applied' : 'Dry-run'} career values update.`);
    console.info(`Report: ${REPORT_PATH}`);
    console.info(JSON.stringify({
      applied: args.apply,
      documentId,
      locales: Object.fromEntries(LOCALES.map((locale) => [
        locale,
        afterDraftPages[locale].whyUs.items.map(({ title, description }) => ({
          title,
          descriptionEmpty: !description,
        })),
      ])),
      media: Object.fromEntries(Object.entries(media).map(([file, item]) => [
        file,
        {
          id: item.id,
          bytesIdentical: item.bytesIdentical,
          sha256: item.sourceSha256,
          alpha: item.alpha,
          dimensions: `${item.width}x${item.height}`,
          reused: item.reused,
        },
      ])),
    }, null, 2));
  });
})().catch((error) => {
  console.error(`Career values update failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});