export const LEGAL_FIELDS = [
  'privacyTitle', 'privacyBody', 'cookieTitle', 'cookieBody',
  'imprintTitle', 'imprintBody',
];

const empty = (value) => value == null || (typeof value === 'string' && !value.trim());

/** Pure, non-overwriting migration plan. Publishing remains an explicit admin action. */
export function planLegalInitialization(draft, published, source) {
  if (!draft || draft.locale !== 'hu') throw new Error('An existing HU draft is required.');
  if (published && (published.locale !== 'hu' || published.documentId !== draft.documentId)) {
    throw new Error('HU draft/published identity conflict.');
  }
  const data = {};
  for (const field of LEGAL_FIELDS) {
    if (typeof source[field] !== 'string' || !source[field].trim()) {
      throw new Error(`Missing authoritative source field: ${field}`);
    }
    // A published edit must never be replaced by seeding an empty draft field.
    if (empty(draft[field]) && !empty(published?.[field])) {
      throw new Error(`Draft/published conflict for ${field}; reconcile in admin first.`);
    }
    if (empty(draft[field])) data[field] = source[field];
  }
  return data;
}

export function assertLegalPublishSafe(draft, published, source, data = {}) {
  if (!published) throw new Error('Existing published HU document required for guarded publication.');
  const planned = { ...draft, ...data };
  for (const field of LEGAL_FIELDS) {
    if (planned[field] !== source[field]) throw new Error(`Admin edit in ${field}; publish manually after review.`);
  }
  for (const field of ['privacyPdf', 'cookiePdf', 'imprintPdf']) {
    if ((draft[field]?.id ?? null) !== (published[field]?.id ?? null)) {
      throw new Error(`Unpublished media change in ${field}; publish manually after review.`);
    }
  }
}

// Strapi emits document events after commit without awaiting their population
// queries. Standalone scripts must let those queries finish before destroying DB.
export async function settleLegalDocumentEvents(app) {
  const pool = app.db.connection.client.pool;
  let idle = 0;
  for (let attempt = 0; attempt < 100; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    idle = pool.numUsed() === 0 && pool.numPendingAcquires() === 0 ? idle + 1 : 0;
    if (idle >= 3) return;
  }
  throw new Error('Legal document event queries did not settle; inspect before rerunning.');
}