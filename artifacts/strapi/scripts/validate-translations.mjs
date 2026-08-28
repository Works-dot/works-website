import {
  TYPES, parseArgs, readJson, withStrapi, loadLocaleRecords, assertBaseline,
  assertTranslationSources, validateTranslationShape, buildImportData,
  deepPopulate, validateDatabaseRecord,
  validateTranslationSlugs, checksum,
} from './translation-pipeline-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.baseline) throw new Error('Usage: validate-translations --baseline <hu-baseline.json> [--input <reviewed.json>]');
const baseline = await readJson(args.baseline);
const translation = args.input ? await readJson(args.input) : null;

await withStrapi(async (strapi) => {
  const errors = [];
  const huRecords = await loadLocaleRecords(strapi, 'hu');
  try { assertBaseline(baseline, huRecords); } catch (error) { errors.push(error.message); }
  const huByKey = new Map(huRecords.map((record) => [`${record.uid}/${record.documentId}`, record]));

  if (translation) {
    if (translation.baselineChecksum !== baseline.checksum) errors.push('Translation input does not match baseline checksum.');
    if (translation.checksum !== checksum(translation.records)) errors.push('Translation input checksum does not match its records.');
    try { assertTranslationSources(translation.records, huRecords); } catch (error) { errors.push(error.message); }
    errors.push(...validateTranslationShape(strapi, translation.records));
    errors.push(...validateTranslationSlugs(strapi, translation.records));
    for (const record of translation.records || []) {
      const hu = huByKey.get(`${record.uid}/${record.documentId}`);
      if (!hu) continue;
      try { await buildImportData(strapi, record, hu, true); } catch (error) { errors.push(error.message); }
    }
  }

  for (const uid of TYPES) {
    const schema = strapi.contentTypes[uid];
    const expected = baseline.entries.filter((entry) => entry.uid === uid).length;
    const drafts = await strapi.db.query(uid).findMany({
      where: {
        locale: 'en',
        ...(schema.options?.draftAndPublish !== false ? { publishedAt: null } : {}),
      },
      populate: deepPopulate(strapi, uid),
    });
    if (drafts.length !== expected) errors.push(`${uid}: expected ${expected} EN drafts, found ${drafts.length}.`);
    if (schema.options?.draftAndPublish !== false) {
      const published = await strapi.db.query(uid).count({ where: { locale: 'en', publishedAt: { $notNull: true } } });
      if (published) errors.push(`${uid}: ${published} EN published version(s) found; expected none.`);
    }
    const slugPaths = [];
    for (const [name, attribute] of Object.entries(schema.attributes)) {
      if (attribute.type === 'uid') slugPaths.push(name);
      if (attribute.type === 'component' && attribute.component === 'service.general') slugPaths.push(`${name}.slug`);
    }
    for (const slugPath of slugPaths) {
      const values = drafts.map((row) => slugPath.split('.').reduce((value, key) => value?.[key], row)).filter(Boolean);
      const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
      if (duplicates.length) errors.push(`${uid}: duplicate EN ${slugPath}: ${[...new Set(duplicates)].join(', ')}.`);
    }
    for (const row of drafts) {
      const source = huByKey.get(`${uid}/${row.documentId}`);
      if (!source) errors.push(`${uid}/${row.documentId}: EN document has no HU source.`);
      else errors.push(...validateDatabaseRecord(strapi, uid, source, row));
      if (row.seo?.metaTitle?.length > 60) errors.push(`${uid}/${row.documentId}: SEO title exceeds 60 characters.`);
      if (row.seo?.metaDescription?.length > 160) errors.push(`${uid}/${row.documentId}: SEO description exceeds 160 characters.`);
    }
  }

  if (errors.length) throw new Error(`Translation validation failed:\n- ${[...new Set(errors)].join('\n- ')}`);
  console.info(`Validation passed: HU baseline unchanged and ${baseline.recordCount} complete EN drafts expected/found.`);
});