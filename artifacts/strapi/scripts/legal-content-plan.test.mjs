import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGAL_FIELDS, planLegalInitialization, assertLegalPublishSafe } from './legal-content-plan.mjs';

const source = Object.fromEntries(LEGAL_FIELDS.map((field) => [field, `Source ${field}`]));
const draft = { documentId: 'legal', locale: 'hu', privacyPdf: { id: 7 } };

test('fills only empty HU fields without media or system fields', () => {
  assert.deepEqual(planLegalInitialization(draft, null, source), source);
  assert.deepEqual(draft.privacyPdf, { id: 7 });
});
test('rerun preserves admin edits and becomes a no-op', () => {
  const edited = { ...draft, ...source, privacyBody: 'Admin correction' };
  assert.deepEqual(planLegalInitialization(edited, null, source), {});
});
test('stops conflicting published values and foreign locales', () => {
  assert.throws(() => planLegalInitialization(draft, { ...draft, privacyBody: 'Published edit' }, source), /conflict/);
  assert.throws(() => planLegalInitialization({ ...draft, locale: 'en' }, null, source), /HU/);
});
test('rejects missing source before any write', () => {
  assert.throws(() => planLegalInitialization(draft, null, {}), /authoritative/);
});
test('guarded publication refuses admin draft edits and media changes', () => {
  assert.doesNotThrow(() => assertLegalPublishSafe({ ...draft, ...source }, draft, source));
  assert.throws(() => assertLegalPublishSafe({ ...draft, ...source, privacyBody: 'Admin' }, draft, source), /Admin edit/);
  assert.throws(() => assertLegalPublishSafe({ ...draft, ...source, privacyPdf: { id: 8 } }, draft, source), /media change/);
});