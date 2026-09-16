import assert from 'node:assert/strict';

import {
  approvedDescriptionsFromReport,
  approvedDescriptionsFromSnapshot,
  assertApprovedDescriptions,
  assertSupportedRuntime,
  assertWhyUsShape,
  assertDraftPublishedUnrelatedMatch,
  makeWhyUsPayload,
  parseArgs,
  prepareMediaDefinitions,
} from './update-career-values-production.mjs';

assert.doesNotThrow(() => assertSupportedRuntime('18.20.0'));
assert.doesNotThrow(() => assertSupportedRuntime('22.14.0'));
assert.throws(
  () => assertSupportedRuntime('17.9.1'),
  /requires Node\.js 18 through 22/,
);
assert.throws(
  () => assertSupportedRuntime('23.0.0'),
  /requires Node\.js 18 through 22/,
);
const definitions = await prepareMediaDefinitions();
assert.equal(definitions.length, 3, 'the production update must define exactly three graphics');
assert.deepEqual(
  definitions.map(({ title }) => title),
  ['Együttműködés', 'Alkalmazkodás', 'Empátia'],
);
for (const definition of definitions) {
  assert.deepEqual(
    { width: definition.width, height: definition.height },
    { width: 960, height: 610 },
    `${definition.file}: approved source dimensions`,
  );
  assert.match(definition.sourceSha256, /^[a-f0-9]{64}$/);
  assert.equal(definition.formatFiles.length, 3, `${definition.file}: generated seed count`);
  for (const format of definition.formatFiles) {
    assert.equal(format.sha256, definition.formatSha256[format.name.split('_')[0]]);
  }
  assert.deepEqual(
    definition.formatFiles.map(({ name }) => name.split('_')[0]),
    ['small', 'medium', 'thumbnail'],
    `${definition.file}: generated format names`,
  );
}

const before = {
  documentId: 'production-document',
  whyUs: {
    sectionHeading: 'Our values',
    // Deliberately shuffled: descriptions must follow their titles.
    items: [
      { title: 'Empathy', description: 'empathy description' },
      { title: 'Purposefulness', description: '' },
      { title: 'Collaboration', description: 'collaboration description' },
      { title: 'Adaptability', description: 'adaptability description' },
    ],
  },
};
assert.deepEqual(parseArgs(['--restore-production']), { apply: false, restore: true });
assert.doesNotThrow(() => assertWhyUsShape(before, 'en', 'draft'));
const payload = makeWhyUsPayload(before, 'en', [101, 102, 103]);
assert.deepEqual(
  payload.items,
  [
    { title: 'Collaboration', description: 'collaboration description', image: 101 },
    { title: 'Adaptability', description: 'adaptability description', image: 102 },
    { title: 'Empathy', description: 'empathy description', image: 103 },
  ],
);

assert.throws(
  () => assertWhyUsShape({
    ...before,
    whyUs: {
      ...before.whyUs,
      items: [...before.whyUs.items, { title: 'Unapproved', description: 'must fail' }],
    },
  }, 'en', 'draft'),
  /refusing to remove anything except/,
);
assert.throws(
  () => assertWhyUsShape({
    ...before,
    whyUs: {
      ...before.whyUs,
      items: before.whyUs.items.map((item) => (
        item.title === 'Empathy' ? { ...item, title: 'Adaptability' } : item
      )),
    },
  }, 'en', 'draft'),
  /duplicate title/,
);

const approvedReport = approvedDescriptionsFromReport({
  format: 'works-career-values-three-update-report-v1',
  afterDraft: {
    hu: {
      items: [
        { title: 'Együttműködés', description: 'HU collaboration' },
        { title: 'Alkalmazkodás', description: 'HU adaptability' },
        { title: 'Empátia', description: 'HU empathy' },
      ],
    },
    en: {
      items: [
        { title: 'Collaboration', description: 'EN collaboration' },
        { title: 'Adaptability', description: 'EN adaptability' },
        { title: 'Empathy', description: 'EN empathy' },
      ],
    },
  },
}, 'fixture');
const approvedSnapshot = approvedDescriptionsFromSnapshot({
  format: 'works-career-values-before-v1',
  locales: {
    hu: {
      whyUs: {
        items: [
          { title: 'Empátia', description: 'HU empathy' },
          { title: 'Alkalmazkodás', description: 'HU adaptability' },
          { title: 'Együttműködés', description: 'HU collaboration' },
        ],
      },
    },
    en: {
      whyUs: {
        items: [
          { title: 'Empathy', description: 'EN empathy' },
          { title: 'Adaptability', description: 'EN adaptability' },
          { title: 'Collaboration', description: 'EN collaboration' },
          { title: 'Purposefulness', description: '' },
        ],
      },
    },
  },
}, 'fixture');
assert.equal(approvedSnapshot.en.get('Empathy'), 'EN empathy');
const alignedPages = Object.fromEntries(['hu', 'en'].map((locale) => [
  locale,
  Object.fromEntries(['draft', 'published'].map((status) => [
    status,
    {
      documentId: `${locale}-document`,
      hero: { heading: 'same' },
      whyUs: { items: [] },
    },
  ])),
]));
assert.doesNotThrow(() => assertDraftPublishedUnrelatedMatch(alignedPages, 'fixture'));
const divergedPages = structuredClone(alignedPages);
divergedPages.hu.draft.hero.heading = 'pending unrelated draft edit';
assert.throws(
  () => assertDraftPublishedUnrelatedMatch(divergedPages, 'fixture'),
  /refusing to publish pending unrelated draft edits/,
);
const approvedPages = structuredClone(alignedPages);
for (const locale of ['hu', 'en']) {
  for (const status of ['draft', 'published']) {
    approvedPages[locale][status].whyUs.items = [...approvedReport[locale].entries()]
      .map(([title, description]) => ({ title, description }));
  }
}
assert.doesNotThrow(() => assertApprovedDescriptions(approvedPages, approvedReport, 'fixture'));
approvedPages.en.draft.whyUs.items[0].description = 'unexpected';
assert.throws(
  () => assertApprovedDescriptions(approvedPages, approvedReport, 'fixture'),
  /description differs from the approved dev report/,
);
assert.equal(approvedReport.hu.get('Empátia'), 'HU empathy');
assert.equal(approvedReport.en.get('Collaboration'), 'EN collaboration');

console.info('✓ Production career-values updater preflight tests passed');