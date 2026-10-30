const UID = "api::blog-post.blog-post";

function iso(value: any): string | undefined {
  if (!value) return undefined;
  const text = value instanceof Date ? value.toISOString() : String(value);
  const input = /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00.000Z` : text;
  const time = Date.parse(input);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

// publishedAt is reset by Strapi's Draft & Publish. Keep a separate immutable
// first-publication timestamp on the draft as well as the published version.
export function registerArticlePublicationDates(strapi: any) {
  strapi.documents.use(async (ctx: any, next: () => Promise<any>) => {
    if (ctx.uid !== UID || !["create", "update", "publish"].includes(ctx.action)) return next();
    return strapi.db.transaction(async ({ trx }: any) => {
      const params = ctx.params;
      if (params.documentId) {
        await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`article-date:${params.documentId}`]);
      }
      const query = strapi.db.query(UID);
      const rows = params.documentId ? await query.findMany({
        where: { documentId: params.documentId },
      }) : [];
      const origin = (locale: string) => {
        const variants = rows.filter((row: any) => row.locale === locale);
        const saved = variants.find((row: any) => row.originalPublishedAt);
        const published = variants.find((row: any) => row.publishedAt);
        return iso(saved?.originalPublishedAt) || iso(published?.date) || iso(published?.publishedAt);
      };
      if (ctx.action === "publish") {
        const locale = params.locale || await strapi.plugin("i18n").service("locales").getDefaultLocale();
        for (const row of rows.filter((r: any) => locale === "*" || r.locale === locale)) {
          const stamp = origin(row.locale) || iso(row.date) || new Date().toISOString();
          await query.update({ where: { id: row.id }, data: {
            originalPublishedAt: stamp, updatedAt: row.updatedAt,
          } });
        }
      } else {
        const locale = params.locale || await strapi.plugin("i18n").service("locales").getDefaultLocale();
        const prior = origin(locale);
        const draft = rows.find((row: any) => row.locale === locale && !row.publishedAt);
        params.data = { ...params.data, originalPublishedAt: prior ||
          (params.status === "published" ? iso(params.data?.date ?? draft?.date) || new Date().toISOString() : null) };
      }
      return next();
    });
  });
}
