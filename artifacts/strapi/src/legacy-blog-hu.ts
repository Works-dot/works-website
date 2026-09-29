import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const uid = "api::blog-post.blog-post";
const migrationKey = "legacy_english_blog_hu_full_translation_v1";
type Block = { type: "text" | "highlight"; content: string } | { type: "image"; caption: string };
type Translation = {
  documentId: string;
  slug: string;
  sourceChecksum: string;
  title: string;
  excerpt: string;
  content: Block[];
};

const expectedSlugs = new Set([
  "how-do-we-pay-online", "the-economic-effects-of-covid-19",
  "shipping-and-receiving", "messages-during-shipping", "issues-with-packages",
  "microinteractions-when-how-and-why",
  "why-lofi-design-is-important-in-the-design-process",
  "how-state-diagram-can-help-designers",
  "is-the-ux-designer-a-dying-breed-mlfg5",
]);

function blocksOf(post: any): Block[] {
  return (post.contentBlocks || []).map((block: any) => {
    if (block.__component === "content.text-block") return { type: "text", content: block.body };
    if (block.__component === "content.highlight-block") return { type: "highlight", content: block.quote };
    if (block.__component === "content.image-block") return { type: "image", caption: block.caption || "" };
    throw new Error(`Unexpected blog component ${block.__component}`);
  });
}

function contentChecksum(post: any): string {
  return createHash("sha256").update(JSON.stringify({
    title: post.title, excerpt: post.excerpt || "",
    blocks: blocksOf(post),
  })).digest("hex");
}

function matchesTranslation(post: any, translation: Translation): boolean {
  return post.title === translation.title && (post.excerpt || "") === translation.excerpt
    && JSON.stringify(blocksOf(post)) === JSON.stringify(translation.content);
}

const populatePost = {
  image: true,
  author: true,
  tags: true,
  seo: { populate: { ogImage: true } },
  contentBlocks: {
    on: { "content.image-block": { populate: { image: true } } },
  },
};

// Strapi gives draft/published components different row IDs and timestamps;
// relations may likewise have different row IDs while pointing to the same
// documentId. Compare every other property, recursively, including any future
// component fields. Do not flatten components or ignore nested media/SEO.
function comparable(value: any, parentKey = ""): any {
  if (Array.isArray(value)) return value.map((item) => comparable(item, parentKey));
  if (value && typeof value === "object") {
    const hasIdentity = value.documentId != null || value.__component != null || parentKey === "seo";
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["createdAt", "updatedAt", "publishedAt", "createdBy", "updatedBy"].includes(key)
        && !(key === "id" && hasIdentity))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, comparable(child, key)]));
  }
  return value;
}

function componentPayload(block: any): any {
  // Keep any future meaningful component properties when replacing a block.
  return Object.fromEntries(Object.entries(block)
    .filter(([key]) => !["id", "createdAt", "updatedAt", "publishedAt"].includes(key)));
}

export async function migrateLegacyBlogHungarian(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  if (await store.get({ key: migrationKey })) return;

  const jsonPath = path.resolve(process.cwd(), "translation", "legacy-blog-hu.json");
  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const records: Translation[] = payload.records;
  if (payload.version !== 1 || !Array.isArray(records) || records.length !== expectedSlugs.size
    || new Set(records.map((item) => item.slug)).size !== expectedSlugs.size
    || records.some((item) => !expectedSlugs.has(item.slug)
      || !item.documentId || !item.sourceChecksum || !item.title || !item.excerpt
      || !Array.isArray(item.content))) {
    throw new Error("Legacy HU blog translation file is incomplete or invalid");
  }

  const documents = strapi.documents(uid);
  const updates: { source: any; record: Translation }[] = [];
  for (const record of records) {
    const published = await documents.findOne({
      documentId: record.documentId, locale: "hu", status: "published",
      populate: populatePost,
    });
    const draft = await documents.findOne({
      documentId: record.documentId, locale: "hu", status: "draft",
      populate: populatePost,
    });
    if (!published || published.slug !== record.slug || !draft || draft.slug !== record.slug) {
      throw new Error(`Legacy HU blog post missing or identity mismatch: ${record.slug}`);
    }
    if (JSON.stringify(comparable(published)) !== JSON.stringify(comparable(draft))) {
      throw new Error(`Legacy HU blog has unpublished draft edits: ${record.slug}. Review manually before deploying.`);
    }
    for (const version of [published, draft]) {
      if (blocksOf(version).length !== record.content.length
        || blocksOf(version).some((block, i) => block.type !== record.content[i].type)) {
        throw new Error(`Legacy HU blog structure changed: ${record.slug}`);
      }
      if (contentChecksum(version) !== record.sourceChecksum && !matchesTranslation(version, record)) {
        throw new Error(`Legacy HU blog edited since translation: ${record.slug}. Review manually before deploying.`);
      }
    }
    if (matchesTranslation(published, record) && matchesTranslation(draft, record)) continue;
    if (published.contentBlocks.some((block: any) =>
      block.__component === "content.image-block" && !block.image?.id)) {
      throw new Error(`Legacy HU blog image missing: ${record.slug}`);
    }
    updates.push({ source: published, record });
  }

  // Validate all nine first, then write atomically. Never touch EN or generate
  // new documents. Existing document IDs, slugs, relations and media survive.
  await strapi.db.transaction(async () => {
    for (const { source, record } of updates) {
      const contentBlocks = record.content.map((block, i) => {
        const previous = source.contentBlocks[i];
        if (block.type === "image") return {
          ...componentPayload(previous), image: previous.image.id, caption: block.caption,
        };
        return block.type === "text"
          ? { ...componentPayload(previous), body: block.content }
          : { ...componentPayload(previous), quote: block.content };
      });
      await documents.update({
        documentId: record.documentId, locale: "hu", status: "draft",
        data: { title: record.title, excerpt: record.excerpt, contentBlocks },
      });
      await documents.publish({ documentId: record.documentId, locale: "hu" });
    }
    await store.set({ key: migrationKey, value: true });
  });
  strapi.log.info(`Legacy HU blog translation: ${updates.length} post(s) updated, EN untouched`);
  // Deliberately no automatic website rebuild: deploy CMS and verify first,
  // then deploy the website, whose Railway build fetches the CMS content.
}