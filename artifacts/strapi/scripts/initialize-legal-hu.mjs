import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withStrapi, checksum } from './translation-pipeline-lib.mjs';
import { planLegalInitialization, assertLegalPublishSafe, settleLegalDocumentEvents } from './legal-content-plan.mjs';

// Development-only helper: withStrapi verifies database identity against production.
// Never call the general seed or bootstrap. Production rollout uses a separately
// authorized operator and the same reviewed payload through the CMS admin.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const publish = process.argv.includes('--publish');
if (process.argv.slice(2).some((arg) => !['--apply', '--dry-run', '--publish'].includes(arg)) ||
    (apply && process.argv.includes('--dry-run')) || (publish && !apply)) {
  throw new Error('Use --dry-run (default) or --apply [--publish].');
}
const source = JSON.parse(await fs.readFile(path.join(root, 'src/seed-documents/legal-hu.json'), 'utf8'));
const uid = 'api::legal-document.legal-document';
await withStrapi(async (app) => {
  const service = app.documents(uid);
  const read = async (status) => service.findFirst({
    locale: 'hu', status, populate: ['privacyPdf', 'cookiePdf', 'imprintPdf'],
  });
  const draft = await read('draft');
  const published = await read('published');
  const data = planLegalInitialization(draft, published, source);
  if (publish) assertLegalPublishSafe(draft, published, source, data);
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', fields: Object.keys(data) }));
  if (!apply || (!Object.keys(data).length && !publish)) return;
  const dir = path.join(root, '.tmp', 'legal-backups');
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(dir, `${Date.now()}.json`),
    JSON.stringify({ draft, published }, null, 2), { flag: 'wx', mode: 0o600 });
  // Stop on concurrent edits rather than applying a stale plan.
  if (checksum(await read('draft')) !== checksum(draft) ||
      checksum(await read('published')) !== checksum(published)) {
    throw new Error('Legal documents changed after backup; no write performed.');
  }
  if (Object.keys(data).length) {
    await service.update({ documentId: draft.documentId, locale: 'hu', data });
  }
  const after = await read('draft');
  for (const [key, value] of Object.entries(data)) {
    if (after[key] !== value) throw new Error(`Post-write verification failed: ${key}`);
  }
  if (checksum(await read('published')) !== checksum(published)) {
    throw new Error('Published document unexpectedly changed; inspect backup.');
  }
  if (publish) {
    assertLegalPublishSafe(after, published, source);
    await service.publish({ documentId: draft.documentId, locale: 'hu' });
    const result = await read('published');
    for (const [field, value] of Object.entries(source)) {
      if (result[field] !== value) throw new Error(`Publication verification failed: ${field}`);
    }
    console.log('Reviewed source-only HU legal fields published; media relations preserved.');
  } else {
    console.log('HU empty draft fields initialized. Review and publish in admin; no automatic publication.');
  }
  await settleLegalDocumentEvents(app);
});