import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// Strapi's public CommonJS entrypoint avoids Node's ESM resolution problem
// with lodash/fp and exposes the Strapi 5 compile/bootstrap APIs.
const { compileStrapi, createStrapi } = createRequire(import.meta.url)('@strapi/strapi');
const strapiRequire = createRequire(createRequire(import.meta.url).resolve('@strapi/strapi'));
const corePackage = strapiRequire.resolve('@strapi/core/package.json');
const { transformContentTypesToModels } = strapiRequire(
  path.join(path.dirname(corePackage), 'dist/utils/transform-content-types-to-models.js'),
);

export const TYPES = [
  'api::about-page.about-page',
  'api::blog-page.blog-page',
  'api::blog-post.blog-post',
  'api::career-page.career-page',
  'api::career-position.career-position',
  'api::contact-page.contact-page',
  'api::global-setting.global-setting',
  'api::homepage.homepage',
  'api::legal-document.legal-document',
  'api::project.project',
  'api::projects-page.projects-page',
  'api::service.service',
  'api::tag.tag',
  'api::team-member.team-member',
];

const SYSTEM_FIELDS = new Set([
  'id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy',
  'locale', 'localizations',
]);

export function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') continue;
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const key = argument.slice(2);
    if (['dry-run', 'apply', 'backup-confirmed'].includes(key)) result[key] = true;
    else {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`--${key} requires a value.`);
      result[key] = value;
      index += 1;
    }
  }
  return result;
}

function databaseIdentity(value) {
  const url = new URL(value);
  return [
    url.hostname.toLowerCase(),
    url.port || '5432',
    decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, ''),
  ].join('|');
}

export function assertSafeEnvironment() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Refusing translation work unless NODE_ENV=development.');
  }
  const databaseUrl = process.env.STRAPI_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('STRAPI_DATABASE_URL or DATABASE_URL is required.');
  if (!process.env.PRODUCTION_DATABASE_URL) {
    throw new Error('PRODUCTION_DATABASE_URL is required to verify database isolation.');
  }
  if (databaseIdentity(databaseUrl) === databaseIdentity(process.env.PRODUCTION_DATABASE_URL)) {
    throw new Error('Refusing translation work: target database identity matches production.');
  }
}

export async function withStrapi(callback) {
  assertSafeEnvironment();
  const context = await compileStrapi({ ignoreDiagnostics: true });
  // register() loads schemas/plugins. Initialize only the database model layer:
  // app.load()/app.bootstrap() would schema-sync, write core-store state, and run
  // this project's mutating bootstrap/seed lifecycle.
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
      console.warn(
        'Strapi completed the command but aborted a pending pool acquisition during shutdown.',
      );
    }
  }
}

export function isLocalized(attribute) {
  return attribute?.pluginOptions?.i18n?.localized === true;
}

function componentPopulate(strapi, componentUid, seen = new Set()) {
  if (seen.has(componentUid)) return true;
  const nextSeen = new Set(seen).add(componentUid);
  const schema = strapi.components[componentUid];
  const populate = {};
  for (const [name, attribute] of Object.entries(schema?.attributes || {})) {
    if (attribute.type === 'media' || attribute.type === 'relation') populate[name] = true;
    if (attribute.type === 'component') {
      populate[name] = { populate: componentPopulate(strapi, attribute.component, nextSeen) };
    }
    if (attribute.type === 'dynamiczone') {
      populate[name] = {
        on: Object.fromEntries(attribute.components.map((uid) => [
          uid, { populate: componentPopulate(strapi, uid, nextSeen) },
        ])),
      };
    }
  }
  return Object.keys(populate).length ? populate : true;
}

export function deepPopulate(strapi, uid) {
  const populate = {};
  for (const [name, attribute] of Object.entries(strapi.contentTypes[uid].attributes)) {
    if (attribute.type === 'media' || attribute.type === 'relation') populate[name] = true;
    if (attribute.type === 'component') {
      populate[name] = { populate: componentPopulate(strapi, attribute.component) };
    }
    if (attribute.type === 'dynamiczone') {
      populate[name] = {
        on: Object.fromEntries(attribute.components.map((componentUid) => [
          componentUid, { populate: componentPopulate(strapi, componentUid) },
        ])),
      };
    }
  }
  return populate;
}

function mediaReference(media) {
  if (!media) return null;
  if (Array.isArray(media)) return media.map(mediaReference);
  return {
    $media: {
      documentId: media.documentId || null,
      hash: media.hash || null,
      url: media.url || null,
      name: media.name || null,
    },
  };
}

function relationReference(value, target) {
  if (!value) return null;
  if (Array.isArray(value)) return value.map((item) => relationReference(item, target));
  if (!value.documentId) throw new Error(`Relation to ${target} has no documentId.`);
  return { $relation: { target, documentId: value.documentId } };
}

function encodeObject(strapi, schema, source) {
  if (source == null) return source;
  const output = {};
  for (const [name, attribute] of Object.entries(schema.attributes || {})) {
    if (!(name in source) || SYSTEM_FIELDS.has(name)) continue;
    const value = source[name];
    if (attribute.type === 'component') {
      const componentSchema = strapi.components[attribute.component];
      output[name] = Array.isArray(value)
        ? value.map((item) => encodeObject(strapi, componentSchema, item))
        : encodeObject(strapi, componentSchema, value);
    } else if (attribute.type === 'dynamiczone') {
      output[name] = (value || []).map((item) => ({
        $component: item.__component,
        ...encodeObject(strapi, strapi.components[item.__component], item),
      }));
    } else if (attribute.type === 'media') {
      const reference = mediaReference(value);
      output[name] = isLocalized(attribute) ? { hu: reference, en: null } : reference;
    } else if (attribute.type === 'relation') {
      output[name] = relationReference(value, attribute.target);
    } else if (isLocalized(attribute) || attribute.type === 'uid') {
      output[name] = { hu: value ?? null, en: null };
    } else {
      output[name] = value ?? null;
    }
  }
  return output;
}

export function encodeRecord(strapi, uid, entity) {
  return {
    uid,
    documentId: entity.documentId,
    content: encodeObject(strapi, strapi.contentTypes[uid], entity),
  };
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

export function checksum(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

export async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(path.resolve(file), 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON ${file}: ${error.message}`);
  }
}

export async function writeJson(file, value) {
  const target = path.resolve(file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(canonical(value), null, 2)}\n`);
}

export async function loadLocaleRecords(strapi, locale) {
  const records = [];
  for (const uid of TYPES) {
    const schema = strapi.contentTypes[uid];
    const draftAndPublish = schema.options?.draftAndPublish !== false;
    const rows = await strapi.db.query(uid).findMany({
      where: {
        locale,
        ...(draftAndPublish ? { publishedAt: null } : {}),
      },
      populate: deepPopulate(strapi, uid),
    });
    const seen = new Set();
    for (const row of rows) {
      if (!row.documentId) throw new Error(`${uid} row ${row.id} has no documentId.`);
      if (seen.has(row.documentId)) {
        throw new Error(`${uid}/${row.documentId} has more than one ${locale} draft.`);
      }
      seen.add(row.documentId);
      records.push(encodeRecord(strapi, uid, row));
    }
    if (schema.kind === 'singleType' && rows.length !== 1) {
      throw new Error(`${uid} must have exactly one ${locale} draft; found ${rows.length}.`);
    }
  }
  return records.sort((a, b) => `${a.uid}/${a.documentId}`.localeCompare(`${b.uid}/${b.documentId}`));
}

export function createBaseline(records) {
  const entries = records.map((record) => ({
    uid: record.uid,
    documentId: record.documentId,
    checksum: checksum(record),
  }));
  return {
    format: 'works-strapi-hu-baseline-v1',
    locale: 'hu',
    recordCount: entries.length,
    entries,
    checksum: checksum(entries),
  };
}

export function assertBaseline(baseline, currentRecords) {
  if (baseline?.format !== 'works-strapi-hu-baseline-v1') {
    throw new Error('Unsupported or missing HU baseline format.');
  }
  const current = createBaseline(currentRecords);
  if (baseline.checksum !== current.checksum) {
    const oldMap = new Map((baseline.entries || []).map((entry) => [`${entry.uid}/${entry.documentId}`, entry.checksum]));
    const changed = current.entries
      .filter((entry) => oldMap.get(`${entry.uid}/${entry.documentId}`) !== entry.checksum)
      .map((entry) => `${entry.uid}/${entry.documentId}`);
    throw new Error(`HU baseline changed${changed.length ? `: ${changed.join(', ')}` : ' (record set differs)'}. Re-export and re-review translations.`);
  }
}

function sourceProjection(value) {
  if (Array.isArray(value)) return value.map(sourceProjection);
  if (value && typeof value === 'object') {
    if (Object.hasOwn(value, 'hu') && Object.hasOwn(value, 'en')) {
      return { hu: sourceProjection(value.hu) };
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sourceProjection(item)]));
  }
  return value;
}

export function assertTranslationSources(records, huRecords) {
  const expected = new Map(huRecords.map((record) => [
    `${record.uid}/${record.documentId}`, checksum(sourceProjection(record)),
  ]));
  if (records.length !== huRecords.length) throw new Error('Translation record count differs from the HU baseline.');
  const seen = new Set();
  for (const record of records) {
    const key = `${record.uid}/${record.documentId}`;
    if (!expected.has(key)) throw new Error(`Unknown or stale translation record ${key}.`);
    if (seen.has(key)) throw new Error(`Duplicate translation record ${key}.`);
    seen.add(key);
    if (checksum(sourceProjection(record)) !== expected.get(key)) {
      throw new Error(`${key} changed HU text, shared data, references, or component structure.`);
    }
  }
  const missing = [...expected.keys()].filter((key) => !seen.has(key));
  if (missing.length) throw new Error(`Translation is missing source records: ${missing.join(', ')}.`);
}

export function validateTranslationShape(strapi, records) {
  const errors = [];
  const visit = (schema, value, pathName) => {
    if (value == null) return;
    for (const [name, attribute] of Object.entries(schema.attributes || {})) {
      const fieldPath = `${pathName}.${name}`;
      const field = value[name];
      if (attribute.type === 'component') {
        const values = Array.isArray(field) ? field : [field];
        values.filter(Boolean).forEach((item, index) =>
          visit(strapi.components[attribute.component], item, `${fieldPath}[${index}]`));
        if (attribute.component === 'shared.seo') {
          values.filter(Boolean).forEach((item) => {
            if (item.metaTitle?.en?.length > 60) errors.push(`${fieldPath}.metaTitle.en exceeds 60 characters`);
            if (item.metaDescription?.en?.length > 160) errors.push(`${fieldPath}.metaDescription.en exceeds 160 characters`);
          });
        }
      } else if (attribute.type === 'dynamiczone') {
        (field || []).forEach((item, index) => {
          if (!item.$component || !strapi.components[item.$component]) errors.push(`${fieldPath}[${index}] has invalid $component`);
          else visit(strapi.components[item.$component], item, `${fieldPath}[${index}]`);
        });
      } else if (attribute.type === 'media') {
        // Shared media comes from the checksum-verified HU source. Localized
        // legal media may intentionally remain empty until approved EN PDFs
        // are supplied; the mandatory review report tracks those omissions.
      } else if (attribute.type === 'relation') {
        // Relations are stable references, not translator text. Localized
        // targets are resolved to their EN rows during import.
      } else if (isLocalized(attribute) || attribute.type === 'uid') {
        if (!field || typeof field !== 'object' || !Object.hasOwn(field, 'hu') || !Object.hasOwn(field, 'en')) {
          errors.push(`${fieldPath} must contain hu and en values`);
        } else if (field.hu != null && field.hu !== '' && (field.en == null || field.en === '')) {
          errors.push(`${fieldPath}.en is incomplete`);
        } else {
          const maxLength = attribute.maxLength
            ?? (['string', 'uid', 'email'].includes(attribute.type) ? 255 : null);
          if (
            maxLength &&
            typeof field.en === 'string' &&
            field.en.length > maxLength
          ) {
            errors.push(`${fieldPath}.en exceeds ${maxLength} characters`);
          }
        }
      }
    }
  };
  for (const record of records) {
    const schema = strapi.contentTypes[record.uid];
    if (!schema || !TYPES.includes(record.uid)) errors.push(`Unsupported uid ${record.uid}`);
    else visit(schema, record.content, `${record.uid}/${record.documentId}`);
  }
  return errors;
}

export function validateTranslationSlugs(strapi, records) {
  const errors = [];
  for (const uid of TYPES) {
    const schema = strapi.contentTypes[uid];
    const values = [];
    for (const record of records.filter((item) => item.uid === uid)) {
      for (const [name, attribute] of Object.entries(schema.attributes)) {
        if (attribute.type === 'uid') values.push([record.content?.[name]?.en, `${record.documentId}.${name}`]);
        if (attribute.type === 'component' && attribute.component === 'service.general') {
          values.push([record.content?.[name]?.slug?.en, `${record.documentId}.${name}.slug`]);
        }
      }
    }
    const seen = new Map();
    for (const [value, fieldPath] of values.filter(([value]) => value)) {
      if (seen.has(value)) errors.push(`${uid}: duplicate EN slug "${value}" at ${seen.get(value)} and ${fieldPath}`);
      else seen.set(value, fieldPath);
    }
  }
  return errors;
}

function refDocumentIds(value, marker) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map((item) => item?.[marker]?.documentId).filter(Boolean).sort();
}

export function validateDatabaseRecord(strapi, uid, source, english) {
  const errors = [];
  const visit = (schema, encoded, actual, pathName) => {
    for (const [name, attribute] of Object.entries(schema.attributes || {})) {
      if (SYSTEM_FIELDS.has(name) || attribute.mappedBy) continue;
      const fieldPath = `${pathName}.${name}`;
      const expected = encoded?.[name];
      const value = actual?.[name];
      if (attribute.type === 'component') {
        const expectedItems = Array.isArray(expected) ? expected : expected == null ? [] : [expected];
        const actualItems = Array.isArray(value) ? value : value == null ? [] : [value];
        if (expectedItems.length !== actualItems.length) errors.push(`${fieldPath} component count differs from HU`);
        expectedItems.forEach((item, index) =>
          visit(strapi.components[attribute.component], item, actualItems[index], `${fieldPath}[${index}]`));
      } else if (attribute.type === 'dynamiczone') {
        if ((expected || []).length !== (value || []).length) errors.push(`${fieldPath} block count differs from HU`);
        (expected || []).forEach((item, index) => {
          if (item.$component !== value?.[index]?.__component) errors.push(`${fieldPath}[${index}] component type differs from HU`);
          else visit(strapi.components[item.$component], item, value[index], `${fieldPath}[${index}]`);
        });
      } else if (attribute.type === 'media') {
        const expectedRef = isLocalized(attribute) ? expected?.en : expected;
        const expectedCount = Array.isArray(expectedRef) ? expectedRef.length : expectedRef ? 1 : 0;
        const actualCount = Array.isArray(value) ? value.length : value ? 1 : 0;
        if (expectedCount !== actualCount) errors.push(`${fieldPath} media count differs`);
        if (expectedCount) {
          const expectedMedia = (Array.isArray(expectedRef) ? expectedRef : expectedRef ? [expectedRef] : [])
            .map((item) => item.$media?.documentId || item.$media?.hash || item.$media?.url).sort();
          const actualMedia = (Array.isArray(value) ? value : value ? [value] : [])
            .map((item) => item.documentId || item.hash || item.url).sort();
          if (JSON.stringify(expectedMedia) !== JSON.stringify(actualMedia)) {
            errors.push(`${fieldPath} ${isLocalized(attribute) ? 'localized' : 'shared'} media differs`);
          }
        }
      } else if (attribute.type === 'relation') {
        const expectedIds = refDocumentIds(expected, '$relation');
        const actualIds = (Array.isArray(value) ? value : value ? [value] : [])
          .map((item) => item.documentId).filter(Boolean).sort();
        if (JSON.stringify(expectedIds) !== JSON.stringify(actualIds)) errors.push(`${fieldPath} relation targets differ from HU mapping`);
      } else if (isLocalized(attribute) || attribute.type === 'uid') {
        if (expected?.hu != null && expected.hu !== '' && (value == null || value === '')) errors.push(`${fieldPath} is incomplete`);
      } else if (JSON.stringify(canonical(expected)) !== JSON.stringify(canonical(value ?? null))) {
        errors.push(`${fieldPath} shared value differs from HU`);
      }
    }
  };
  visit(strapi.contentTypes[uid], source.content, english, `${uid}/${source.documentId}`);
  return errors;
}

function isToMany(attribute) {
  return attribute.multiple === true || ['oneToMany', 'manyToMany'].includes(attribute.relation);
}

async function resolveMedia(strapi, wrapped, fieldPath) {
  if (wrapped == null) return null;
  if (Array.isArray(wrapped)) return Promise.all(wrapped.map((item, index) => resolveMedia(strapi, item, `${fieldPath}[${index}]`)));
  const ref = wrapped.$media;
  if (!ref) throw new Error(`${fieldPath} is not a media reference.`);
  const where = ref.documentId ? { documentId: ref.documentId } : ref.hash ? { hash: ref.hash } : { url: ref.url };
  if (!Object.values(where)[0]) throw new Error(`${fieldPath} has no stable media identifier.`);
  const matches = await strapi.db.query('plugin::upload.file').findMany({ where, limit: 2 });
  if (matches.length !== 1) throw new Error(`${fieldPath} resolves to ${matches.length} media files.`);
  return matches[0].id;
}

async function resolveRelation(strapi, wrapped, attribute, fieldPath) {
  const refs = Array.isArray(wrapped) ? wrapped : wrapped == null ? [] : [wrapped];
  const ids = [];
  for (const [index, item] of refs.entries()) {
    const ref = item?.$relation;
    if (!ref || ref.target !== attribute.target || !ref.documentId) {
      throw new Error(`${fieldPath}[${index}] is not a valid ${attribute.target} relation reference.`);
    }
    const target = strapi.contentTypes[attribute.target];
    const localized = target?.pluginOptions?.i18n?.localized === true;
    const row = await strapi.db.query(attribute.target).findOne({
      where: {
        documentId: ref.documentId,
        ...(localized ? { locale: 'en' } : {}),
        ...(target?.options?.draftAndPublish !== false ? { publishedAt: null } : {}),
      },
      select: ['id'],
    });
    if (!row) throw new Error(`${fieldPath} target ${attribute.target}/${ref.documentId} has no usable ${localized ? 'EN ' : ''}draft.`);
    ids.push(row.id);
  }
  return isToMany(attribute) ? ids : (ids[0] ?? null);
}

async function decodeObject(strapi, schema, translated, hu, options, pathName) {
  const data = {};
  for (const [name, attribute] of Object.entries(schema.attributes || {})) {
    if (attribute.mappedBy || SYSTEM_FIELDS.has(name)) continue;
    const fieldPath = `${pathName}.${name}`;
    const input = translated?.[name];
    const huValue = hu?.[name];
    if (attribute.type === 'component') {
      if (input == null) data[name] = input;
      else {
        const values = Array.isArray(input) ? input : [input];
        const huValues = Array.isArray(huValue) ? huValue : [huValue];
        const decoded = await Promise.all(values.map((item, index) =>
          decodeObject(strapi, strapi.components[attribute.component], item, huValues[index], options, `${fieldPath}[${index}]`)));
        data[name] = Array.isArray(input) ? decoded : decoded[0];
      }
    } else if (attribute.type === 'dynamiczone') {
      data[name] = await Promise.all((input || []).map(async (item, index) => {
        const componentUid = item.$component;
        if (!strapi.components[componentUid]) throw new Error(`${fieldPath}[${index}] has invalid $component.`);
        const decoded = await decodeObject(strapi, strapi.components[componentUid], item, huValue?.[index], options, `${fieldPath}[${index}]`);
        return { __component: componentUid, ...decoded };
      }));
    } else if (attribute.type === 'media') {
      const selected = isLocalized(attribute) ? input?.en : huValue;
      data[name] = await resolveMedia(strapi, selected, fieldPath);
    } else if (attribute.type === 'relation') {
      if (options.includeRelations) data[name] = await resolveRelation(strapi, input, attribute, fieldPath);
    } else if (isLocalized(attribute) || attribute.type === 'uid') {
      data[name] = input?.en ?? null;
    } else {
      data[name] = huValue ?? null;
    }
  }
  return data;
}

export async function buildImportData(strapi, record, huRecord, includeRelations) {
  return decodeObject(
    strapi,
    strapi.contentTypes[record.uid],
    record.content,
    huRecord.content,
    { includeRelations },
    `${record.uid}/${record.documentId}`,
  );
}

export async function findEnglishDraft(strapi, uid, documentId) {
  const schema = strapi.contentTypes[uid];
  return strapi.db.query(uid).findOne({
    where: {
      documentId,
      locale: 'en',
      ...(schema.options?.draftAndPublish !== false ? { publishedAt: null } : {}),
    },
    select: ['id', 'documentId'],
  });
}