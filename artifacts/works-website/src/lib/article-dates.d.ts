export function isoArticleDate(value: unknown): string | undefined;
export function articleDates(post: {
  originalPublishedAt?: string | null;
  date?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}): { publishedTime?: string; modifiedTime?: string };
