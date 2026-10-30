// Historical CMS dates have day precision: represent them at midnight UTC.
// Timestamps must include an explicit timezone; never depend on the build TZ.
export function isoArticleDate(value) {
  if (typeof value !== "string" || !value) return undefined;
  const input = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(input)) return undefined;
  const time = Date.parse(input);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

export function articleDates(post) {
  return {
    publishedTime: isoArticleDate(post.originalPublishedAt) || isoArticleDate(post.date) || isoArticleDate(post.publishedAt),
    modifiedTime: isoArticleDate(post.updatedAt),
  };
}
