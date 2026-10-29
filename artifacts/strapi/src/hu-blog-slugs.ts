// Reviewed HU-only identity mapping. Do not use publish(), which could publish
// unrelated draft edits; change just the slug column on existing HU versions.
export const HU_SLUG_MIGRATION = [
  ["e110e4p6k0c4ml9a1wtm56bw", "why-lofi-design-is-important-in-the-design-process", "miert-fontos-a-lofi-design"],
  ["o3lvxuv4pul8az9yhc5tujeg", "microinteractions-when-how-and-why", "mikrointerakciok-mikor-hogyan-miert"],
  ["yg84ksnrfvfppqxzyscf8x74", "how-state-diagram-can-help-designers", "allapotdiagram-a-tervezesben"],
  ["qya03sr2vay1guwkurkueza6", "is-the-ux-designer-a-dying-breed-mlfg5", "kihalofelben-a-ux-designer"],
  ["nh6ut44kpi0lqaggf5tirux1", "how-do-we-pay-online", "hogyan-fizetunk-online"],
  ["ujw1s67r9rio7l9vcc9s2vrx", "the-economic-effects-of-covid-19", "a-covid-hatasa-az-online-vasarlasra"],
  ["ajkhd25h7aplaip5v1z4v4gs", "shipping-and-receiving", "szallitas-es-atvetel"],
  ["cjz20nuq4d3qug249hmlex0r", "messages-during-shipping", "ertesitesek-a-szallitas-alatt"],
  ["vfttft8q8d6l1g2six84e23w", "issues-with-packages", "problemak-a-csomaggal"],
];

export function planHuSlugUpdates(rows: { id: number; documentId: string; locale: string; slug: string }[]) {
  const updates: { id: number; from: string; to: string }[] = [];
  for (const [documentId, from, to] of HU_SLUG_MIGRATION) {
    if (rows.some(row => row.locale === "hu" && row.slug === to && row.documentId !== documentId)) {
      throw new Error(`HU slug destination already belongs to another article: ${to}`);
    }
    for (const row of rows.filter(row => row.documentId === documentId && row.locale === "hu")) {
      if (row.slug !== from && row.slug !== to) {
        throw new Error(`HU article has an unexpected editor-managed slug: ${row.slug}`);
      }
      if (row.slug === from) updates.push({ id: row.id, from, to });
    }
  }
  return updates;
}

export async function migrateHuBlogSlugs(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const key = "hu_blog_canonical_slugs_v1";
  if (await store.get({ key })) return;
  const metadata = strapi.db.metadata.get("api::blog-post.blog-post");
  const column = (name: string) => {
    const value = metadata?.attributes?.[name]?.columnName;
    if (!value) throw new Error(`Missing blog column metadata: ${name}`);
    return value;
  };
  const id = column("id"), doc = column("documentId"), locale = column("locale"), slug = column("slug");
  await strapi.db.connection.transaction(async (trx: any) => {
    // Lock all HU rows to check destination conflicts before changing anything.
    const rows = await trx(metadata.tableName).where(locale, "hu")
      .select({ id, documentId: doc, locale, slug }).forUpdate();
    const updates = planHuSlugUpdates(rows);
    for (const update of updates) {
      const count = await trx(metadata.tableName)
        .where({ [id]: update.id, [locale]: "hu", [slug]: update.from })
        .update({ [slug]: update.to });
      if (count !== 1) throw new Error(`HU slug migration concurrent change: ${update.from}`);
    }
    strapi.log.info(`HU blog slug migration: ${updates.length} existing draft/published rows updated`);
  });
  // A crash before this marker safely repeats the idempotent slug-only plan.
  await store.set({ key, value: true });
}
