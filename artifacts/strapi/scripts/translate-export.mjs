import fs from 'node:fs/promises';
import path from 'node:path';
import {
  checksum,
  parseArgs,
  readJson,
  writeJson,
} from './translation-pipeline-lib.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.output) {
  throw new Error(
    'Usage: translate-export --input <hu-to-en.json> --output <reviewed-en.json> [--progress <progress.json>] [--report <review.md>] [--model <model>]',
  );
}

const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
if (!baseUrl || !apiKey) {
  throw new Error(
    'Replit AI Integrations OpenAI is not configured. Both AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY are required.',
  );
}

const inputPath = path.resolve(args.input);
const outputPath = path.resolve(args.output);
const progressPath = path.resolve(
  args.progress || '/tmp/works-en-translation-125/translation-progress.json',
);
const reportPath = path.resolve(args.report || 'translation/review-required.md');
const model = args.model || 'gpt-5.6-terra';
const maxBatchCharacters = Number(args['batch-characters'] || 16000);
const concurrency = Math.max(1, Number(args.concurrency || 4));

const translation = await readJson(inputPath);
if (translation.format !== 'works-strapi-translation-v1') {
  throw new Error('Unsupported translation file format.');
}

const slots = [];
function collectSlots(value, pathParts, record) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSlots(item, [...pathParts, index], record));
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, 'hu') && Object.hasOwn(value, 'en')) {
    if (typeof value.hu === 'string') {
      slots.push({
        id: `s${slots.length + 1}`,
        uid: record.uid,
        documentId: record.documentId,
        path: pathParts.map(String).join('.'),
        hu: value.hu,
        target: value,
      });
    }
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    collectSlots(item, [...pathParts, key], record);
  }
}

for (const record of translation.records) {
  collectSlots(record.content, [], record);
}

let progress = { format: 'works-translation-progress-v1', completed: {} };
try {
  progress = JSON.parse(await fs.readFile(progressPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (progress.format !== 'works-translation-progress-v1') {
  throw new Error(`Unsupported progress file: ${progressPath}`);
}
let persistProgress = Promise.resolve();

const batches = [];
let current = [];
let currentCharacters = 0;
for (const slot of slots) {
  if (slot.hu === '') {
    progress.completed[slot.id] = '';
    continue;
  }
  if (Object.hasOwn(progress.completed, slot.id)) continue;
  const itemCharacters = slot.hu.length + slot.path.length + slot.uid.length + 120;
  if (current.length && currentCharacters + itemCharacters > maxBatchCharacters) {
    batches.push(current);
    current = [];
    currentCharacters = 0;
  }
  current.push(slot);
  currentCharacters += itemCharacters;
}
if (current.length) batches.push(current);

const systemPrompt = `You are the senior native British English translator and editor for Works., a Hungarian digital product design and UX consultancy.

Translate Hungarian visitor-facing marketing, UX, service, case-study, career and editorial copy into natural, confident, professional British English.

Rules:
- Return only valid JSON in the exact shape {"translations":[{"id":"s1","en":"..."}]}.
- Return exactly one item for every supplied id, in the supplied order. Never omit or add ids.
- Preserve meaning and factual claims. Do not invent achievements, clients, metrics or services.
- Preserve Markdown, inline HTML, paragraph breaks, list markers, links and emphasis exactly. Translate only their human-readable text.
- Keep Works., client names, product names, personal names, abbreviations and established technical terms unchanged unless English convention requires spacing or capitalisation.
- Use British spelling and idiom. Avoid literal Hungarian syntax and generic AI-marketing clichés.
- For a path ending in "slug", return a concise lowercase ASCII kebab-case English slug, not prose.
- For internal route/link fields, use this reserved map where applicable: / → /en, /projektek → /en/projects, /rolunk → /en/about, /kapcsolat → /en/contact, /karrier → /en/careers, /blog → /en/blog, /adatkezeles → /en/privacy, /sutik → /en/cookies, /szolgaltatasok/<slug> → /en/services/<english-slug>.
- Keep email addresses and phone numbers unchanged. Keep the brand name "Works." unchanged.
- Translate legal-consent copy accurately but do not claim legal approval.
- SEO titles should be at most 60 characters and SEO descriptions at most 160 characters.
- Image captions and quotations must preserve their tone and attribution.
`;

async function translateBatch(batch, batchIndex) {
  const payload = batch.map(({ id, uid, documentId, path: fieldPath, hu }) => ({
    id,
    contentType: uid,
    documentId,
    fieldPath,
    hu,
  }));
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          max_completion_tokens: 16000,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Translate this batch. Return all ${payload.length} ids:\n${JSON.stringify(payload)}`,
            },
          ],
        }),
      });
      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after');
        const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
        const error = new Error(
          `OpenAI proxy returned HTTP ${response.status}: ${await response.text()}`,
        );
        if (response.status === 429) {
          error.retryAfterMs = Number.isFinite(retryAfterSeconds)
            ? Math.max(1000, retryAfterSeconds * 1000)
            : 30000;
        }
        throw error;
      }
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error('Translation response has no message content.');
      const parsed = JSON.parse(content);
      const returned = parsed.translations;
      if (!Array.isArray(returned) || returned.length !== batch.length) {
        throw new Error(
          `Expected ${batch.length} translations, received ${Array.isArray(returned) ? returned.length : 'invalid JSON shape'}.`,
        );
      }
      for (let index = 0; index < batch.length; index += 1) {
        const expected = batch[index];
        const item = returned[index];
        if (item?.id !== expected.id || typeof item.en !== 'string') {
          throw new Error(
            `Translation order/type mismatch at ${expected.id}; received ${JSON.stringify(item)}`,
          );
        }
        progress.completed[expected.id] = item.en;
      }
      persistProgress = persistProgress.then(async () => {
        await fs.mkdir(path.dirname(progressPath), { recursive: true });
        await fs.writeFile(progressPath, `${JSON.stringify(progress, null, 2)}\n`);
      });
      await persistProgress;
      console.info(
        `Translated batch ${batchIndex + 1}/${batches.length} (${batch.length} fields).`,
      );
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `Batch ${batchIndex + 1} attempt ${attempt}/8 failed: ${error.message}`,
      );
      if (attempt < 8) {
        await new Promise((resolve) =>
          setTimeout(resolve, error.retryAfterMs || attempt * 5000));
      }
    }
  }
  throw lastError;
}

console.info(
  `Translation source: ${translation.records.length} documents, ${slots.length} text fields; ${batches.length} batch(es) remaining at concurrency ${concurrency}.`,
);
let nextBatch = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
    while (nextBatch < batches.length) {
      const index = nextBatch;
      nextBatch += 1;
      await translateBatch(batches[index], index);
    }
  }),
);
await persistProgress;

for (const slot of slots) {
  if (!Object.hasOwn(progress.completed, slot.id)) {
    throw new Error(`Translation is missing ${slot.id} (${slot.uid}/${slot.documentId}.${slot.path}).`);
  }
  slot.target.en = progress.completed[slot.id];
}

translation.checksum = checksum(translation.records);
translation.translation = {
  model,
  textFieldCount: slots.length,
  sourceCharacterCount: slots.reduce((total, slot) => total + slot.hu.length, 0),
  status: 'machine-translated-requires-human-review',
};
await writeJson(outputPath, translation);

const reviewMatchers = [
  /(?:^|\.)slug$/,
  /(?:Link|Url|URL|address|contactPhone|siteName|value)$/i,
  /careerConsent\.(?:checkbox1Text|checkbox2Text)$/,
];
const reviewSlots = slots.filter((slot) =>
  reviewMatchers.some((matcher) => matcher.test(slot.path)),
);
const localisedMedia = [];
function collectMissingLocalisedMedia(value, pathParts, record) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectMissingLocalisedMedia(item, [...pathParts, index], record));
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (
    Object.hasOwn(value, 'hu') &&
    Object.hasOwn(value, 'en') &&
    value.hu?.$media &&
    value.en == null
  ) {
    localisedMedia.push(
      `${record.uid}/${record.documentId}.${pathParts.map(String).join('.')}`,
    );
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    collectMissingLocalisedMedia(item, [...pathParts, key], record);
  }
}
for (const record of translation.records) {
  collectMissingLocalisedMedia(record.content, [], record);
}

const report = `# English CMS translation review

The machine translation is ready for editorial review. Nothing in this report
constitutes legal approval.

## Summary

- Documents: ${translation.records.length}
- Translated text fields: ${slots.length}
- Source characters: ${translation.translation.sourceCharacterCount}
- Translation model: ${model}
- Import status: not imported by this command

## Mandatory editorial decisions

Review these route, slug, machine-value, address and contact fields before the
English site is published:

${reviewSlots.map((slot) => `- \`${slot.uid}/${slot.documentId}.${slot.path}\``).join('\n')}

## Mandatory legal review

- Review the English versions of both career-consent checkbox texts with legal counsel.
- Provide approved English legal PDFs for every item below. They intentionally remain empty:

${localisedMedia.length ? localisedMedia.map((item) => `- \`${item}\``).join('\n') : '- No missing localised media detected.'}

## Safety state

- The reviewed JSON keeps all HU source values and stable references unchanged.
- EN records must remain drafts during import.
- Production was not accessed or changed by the translation command.
`;
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, report);

console.info(`Wrote translated content to ${outputPath}`);
console.info(`Wrote mandatory review list to ${reportPath}`);