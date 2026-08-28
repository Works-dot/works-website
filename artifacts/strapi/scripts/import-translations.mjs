import {
  parseArgs, readJson, withStrapi, loadLocaleRecords, assertBaseline,
  assertTranslationSources, validateTranslationShape, buildImportData,
  validateTranslationSlugs, checksum,
} from './translation-pipeline-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.baseline) {
  throw new Error('Usage: import-translations --input <reviewed.json> --baseline <hu-baseline.json> (--dry-run | --apply --backup-confirmed)');
}
if (Boolean(args['dry-run']) === Boolean(args.apply)) {
  throw new Error('Choose exactly one of --dry-run or --apply.');
}
if (args.apply && !args['backup-confirmed']) {
  throw new Error('Live import requires --backup-confirmed. First create a pg_dump and Strapi export; see docs/i18n/translation-pipeline.md.');
}

const translation = await readJson(args.input);
const baseline = await readJson(args.baseline);
if (translation.format !== 'works-strapi-translation-v1') throw new Error('Unsupported translation file format.');
if (translation.baselineChecksum !== baseline.checksum) throw new Error('Translation file and HU baseline do not match.');
if (translation.checksum !== checksum(translation.records)) {
  throw new Error('Translation file checksum does not match its records.');
}

await withStrapi(async (strapi) => {
  const huRecords = await loadLocaleRecords(strapi, 'hu');
  assertBaseline(baseline, huRecords);
  assertTranslationSources(translation.records, huRecords);
  const errors = [
    ...validateTranslationShape(strapi, translation.records),
    ...validateTranslationSlugs(strapi, translation.records),
  ];
  if (errors.length) throw new Error(`Reviewed translation is incomplete:\n- ${errors.join('\n- ')}`);
  const huByKey = new Map(huRecords.map((record) => [`${record.uid}/${record.documentId}`, record]));
  // Resolve every media reference and build all component payloads before a write.
  for (const record of translation.records) {
    const hu = huByKey.get(`${record.uid}/${record.documentId}`);
    if (!hu) throw new Error(`Unknown or stale translation record ${record.uid}/${record.documentId}.`);
    await buildImportData(strapi, record, hu, false);
  }
  if (args['dry-run']) {
    console.info(`Dry run passed for ${translation.records.length} EN documents; no database writes were made.`);
    return;
  }

  await strapi.db.transaction(async () => {
    // Phase one creates all EN documents without relations. This makes localized
    // relation targets available even for circular service/project relations.
    for (const record of translation.records) {
      const hu = huByKey.get(`${record.uid}/${record.documentId}`);
      const data = await buildImportData(strapi, record, hu, false);
      const documents = strapi.documents(record.uid);
      const draftStatus = strapi.contentTypes[record.uid].options?.draftAndPublish !== false
        ? { status: 'draft' }
        : {};
      // In Strapi v5, update() creates a missing locale under the supplied
      // documentId. create() always generates a new documentId, even when one
      // is passed, so it must never be used to add a localization.
      await documents.update({
        documentId: record.documentId,
        locale: 'en',
        ...draftStatus,
        data,
      });
    }
    // Updating only owning relation fields avoids replacing components twice.
    for (const record of translation.records) {
      const schema = strapi.contentTypes[record.uid];
      const relationData = {};
      const full = await buildImportData(strapi, record, huByKey.get(`${record.uid}/${record.documentId}`), true);
      for (const [name, attribute] of Object.entries(schema.attributes)) {
        if (attribute.type === 'relation' && !attribute.mappedBy) relationData[name] = full[name];
      }
      if (Object.keys(relationData).length) {
        const draftStatus = schema.options?.draftAndPublish !== false ? { status: 'draft' } : {};
        await strapi.documents(record.uid).update({
          documentId: record.documentId, locale: 'en', ...draftStatus, data: relationData,
        });
      }
    }
  });
  console.info(`Imported ${translation.records.length} EN drafts in one transaction; nothing was published.`);
});