import { parseArgs, withStrapi, loadLocaleRecords, createBaseline, writeJson, checksum } from './translation-pipeline-lib.mjs';

const args = parseArgs(process.argv.slice(2));
const output = args.output || 'translation/hu-to-en.json';
const baselineOutput = args.baseline || 'translation/hu-baseline.json';

await withStrapi(async (strapi) => {
  const records = await loadLocaleRecords(strapi, 'hu');
  const baseline = createBaseline(records);
  const translation = {
    format: 'works-strapi-translation-v1',
    sourceLocale: 'hu',
    targetLocale: 'en',
    baselineChecksum: baseline.checksum,
    instructions: 'Fill only en values. Do not alter hu values, documentId, references, array order, or $component.',
    records,
    checksum: checksum(records),
  };
  await writeJson(output, translation);
  await writeJson(baselineOutput, baseline);
  console.info(`Exported ${records.length} HU documents to ${output}`);
  console.info(`Wrote immutable HU baseline to ${baselineOutput} (${baseline.checksum})`);
});