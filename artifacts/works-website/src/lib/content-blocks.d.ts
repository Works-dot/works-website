export interface StrapiContentBlockInput {
  __component: string;
  body?: string;
  quote?: string;
  image?: { url?: string | null; alternativeText?: string | null; width?: number; height?: number } | null;
  caption?: string;
}

export interface MappedContentBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function strapiImageUrl(url: string | undefined | null): string;

export function mapContentBlocks(
  blocks: StrapiContentBlockInput[] | undefined | null
): MappedContentBlock[];
