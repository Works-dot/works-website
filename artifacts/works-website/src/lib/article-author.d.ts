export interface ArticleAuthor {
  name: string;
  jobTitle?: string;
  bio?: string;
  image?: string;
  imageAlt?: string;
  linkedinUrl?: string;
  worksFor: boolean;
}
export function linkedinProfile(value: unknown): string;
export function fetchAuthorResponse(fetcher: typeof fetch, url: string): Promise<Response>;
export function resolveArticleAuthor(raw: unknown, imageUrl?: (value: string) => string): ArticleAuthor | null;
export function articleAuthor(post: { author?: string; authorDetails?: ArticleAuthor | null }): ArticleAuthor | null;
export function personSchema(author: ArticleAuthor | null | undefined, absoluteUrl: (value: string) => string, organizationId: string): object | undefined;
