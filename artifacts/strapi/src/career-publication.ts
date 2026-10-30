const UID = "api::career-position.career-position";

/** Preserve the first known publication, including unpublish/republish. */
export function registerCareerPublication(strapi: any) {
  strapi.documents.use(async (ctx: any, next: () => Promise<any>) => {
    if (ctx.uid !== UID || !["create", "update", "publish", "unpublish"].includes(ctx.action)) return next();
    return strapi.db.transaction(async ({ trx }: any) => {
      const params = ctx.params;
      if (params.documentId) await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`job-date:${params.documentId}`]);
      const query = strapi.db.query(UID);
      const rows = params.documentId ? await query.findMany({ where: { documentId: params.documentId } }) : [];
      const locale = params.locale || await strapi.plugin("i18n").service("locales").getDefaultLocale();
      const selected = rows.filter((r: any) => locale === "*" || r.locale === locale);
      const origin = (lang: string) => {
        const variants = rows.filter((r: any) => r.locale === lang);
        return variants.find((r: any) => r.originalPublishedAt)?.originalPublishedAt ||
          variants.find((r: any) => r.publishedAt)?.publishedAt;
      };
      if (ctx.action === "publish" || ctx.action === "unpublish") {
        for (const row of selected) {
          const stamp = origin(row.locale) || (ctx.action === "publish" ? new Date().toISOString() : null);
          if (stamp) await query.update({ where: { id: row.id }, data: { originalPublishedAt: stamp, updatedAt: row.updatedAt } });
        }
      } else {
        params.data = { ...params.data, originalPublishedAt: origin(locale) ||
          (params.status === "published" ? new Date().toISOString() : null) };
      }
      const result = await next();
      // Legacy records are deliberately not bulk-published or given invented
      // expiry/location/type values. Editors receive an actionable warning.
      const records = result?.entries || (result ? [result] : []);
      for (const row of records) {
        if (row.isActive && row.publishedAt) {
          const missing = ["validThrough", "employmentType", "addressLocality", "addressCountry"].filter(k => !row[k]);
          if (missing.length) strapi.log.warn(`JobPosting ${row.locale}/${row.slug}: fill ${missing.join(", ")}; incomplete schema omitted.`);
        }
      }
      return result;
    });
  });
}
