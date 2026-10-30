// Recover only missing legacy locale relations from the same article document.
// Explicit mode selections (including intentional author removal) are untouched.
export function planAuthorBackfill(posts: any[], members: any[]) {
  const changes: { id: number; author: number }[] = [];
  for (const post of posts) {
    if (post.author || post.authorMode != null) continue;
    const sources = posts.filter(p => p.documentId === post.documentId && p.author &&
      p.authorMode !== "manual" && p.publishedAt);
    const identities = new Set(sources.map(p => p.author.documentId));
    if (identities.size !== 1) continue;
    const identity = [...identities][0];
    const candidates = members.filter(m => m.documentId === identity &&
      m.locale === post.locale && Boolean(m.publishedAt) === Boolean(post.publishedAt));
    if (candidates.length === 1) changes.push({ id: post.id, author: candidates[0].id });
  }
  return changes;
}

export async function backfillLocalizedAuthors(strapi: any) {
  const store = strapi.store({ type: "plugin", name: "migrations" });
  const key = "localized_author_relations_v1";
  await strapi.db.transaction(async ({ trx }: any) => {
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [key]);
    if (await store.get({ key })) return;
    const schema = strapi.config.get("database.connection.connection.schema", "strapi");
    // Old replicas may still accept edits during a rolling deployment. Hold
    // row locks through the check/write so a concurrent removal isn't undone.
    for (const uid of ["api::blog-post.blog-post", "api::team-member.team-member"]) {
      const table = strapi.db.metadata.get(uid).tableName;
      await trx.withSchema(schema).table(table).select("id").forUpdate();
    }
    const query = strapi.db.query("api::blog-post.blog-post");
    const posts = await query.findMany({ populate: { author: true } });
    const members = await strapi.db.query("api::team-member.team-member").findMany({});
    const changes = planAuthorBackfill(posts, members);
    for (const change of changes) {
      await query.update({ where: { id: change.id }, data: { author: change.author } });
    }
    // No documents.publish: pending title/body/media edits remain drafts.
    await store.set({ key, value: { completed: true, changedRows: changes.map(c => c.id) } });
    strapi.log.info(`Article author locale backfill: ${changes.length} existing author relations restored`);
  });
}
