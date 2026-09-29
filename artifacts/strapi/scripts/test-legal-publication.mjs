import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { withStrapi } from './translation-pipeline-lib.mjs';
import { planLegalInitialization, settleLegalDocumentEvents } from './legal-content-plan.mjs';

// Development integration test only. No server/bootstrap is started.
// withStrapi refuses production or an unverifiable database identity.
const source = JSON.parse(await fs.readFile(new URL('../src/seed-documents/legal-hu.json', import.meta.url)));
const base = 'http://localhost:8099/strapi/api/legal-document';
await withStrapi(async (app) => {
  const docs = app.documents('api::legal-document.legal-document');
  for (const locale of ['hu', 'en']) {
    const draft = await docs.findFirst({ locale, status: 'draft' });
    assert.ok(draft, `Existing ${locale} draft required`);
    const published = await docs.findFirst({ locale, status: 'published' });
    const marker = `PRIVATE_LEGAL_DRAFT_TEST_${locale}_${Date.now()}`;
    const backups = new URL('../.tmp/legal-backups/', import.meta.url);
    await fs.mkdir(backups, { recursive: true, mode: 0o700 });
    await fs.writeFile(new URL(`test-${locale}-${Date.now()}.json`, backups),
      JSON.stringify({ draft, published }, null, 2), { flag: 'wx', mode: 0o600 });
    try {
      await docs.update({ documentId: draft.documentId, locale, data: { privacyTitle: marker } });
      const edited = await docs.findFirst({ locale, status: 'draft' });
      assert.equal(edited.privacyTitle, marker);
      if (locale === 'hu') {
        assert.deepEqual(planLegalInitialization(edited, published, source), {},
          'Initializer must preserve a real admin draft edit');
      }
      for (const status of ['published', 'draft']) {
        const response = await fetch(`${base}?locale=${locale}&status=${status}&populate=*`);
        assert.equal(response.status, 200);
        const json = await response.json();
        assert.equal(json.data.privacyTitle, published.privacyTitle);
        assert.ok(json.data.publishedAt);
        assert.ok(!JSON.stringify(json).includes(marker), 'No draft values in public API');
        assert.equal(json.data.localizations, undefined, 'No relation traversal');
      }
    } finally {
      const current = await docs.findFirst({ locale, status: 'draft' });
      if (current.privacyTitle !== marker) {
        throw new Error(`Concurrent ${locale} admin edit detected; refusing restore. Consult private backup.`);
      }
      await docs.update({ documentId: draft.documentId, locale, data: { privacyTitle: draft.privacyTitle } });
      await settleLegalDocumentEvents(app);
    }
  }
  console.log('PASS HU/EN real drafts excluded from public API; initializer preserves admin edits; test edits restored.');
});