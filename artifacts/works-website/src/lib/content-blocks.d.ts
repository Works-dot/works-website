export interface StrapiContentBlockInput {
  __component: string;
  body?: string;
  quote?: string;
  image?: { url?: string | null } | null;
  caption?: string;
}

export interface MappedContentBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
}

export function strapiImageUrl(url: string | undefined | null): string;

export function mapContentBlocks(
  blocks: StrapiContentBlockInput[] | undefined | null
): MappedContentBlock[];
