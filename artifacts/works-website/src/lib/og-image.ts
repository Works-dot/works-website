import manifestData from "../data/og-image-manifest.json";
const manifest = manifestData as Record<string, { url: string; width: number; height: number }>;

export function ogImageProperties(meta: {
  ogImageAlt?: string; ogImageWidth?: number; ogImageHeight?: number;
}): Array<[string, string | undefined]> {
  return [
    ["og:image:alt", meta.ogImageAlt || undefined],
    ["og:image:width", meta.ogImageWidth ? String(meta.ogImageWidth) : undefined],
    ["og:image:height", meta.ogImageHeight ? String(meta.ogImageHeight) : undefined],
  ];
}

export function syncOgImageProperties(
  meta: Parameters<typeof ogImageProperties>[0],
  upsert: (key: string, value: string) => void,
  remove: (key: string) => void,
) {
  for (const [key, value] of ogImageProperties(meta)) {
    if (value !== undefined) upsert(key, value);
    else remove(key);
  }
}

export function featuredOgImage(record: { image?: string; imageAlt?: string }) {
  const source = record.image || "/opengraph.jpg";
  const generated = manifest[source];
  if (!generated) {
    // Live dev/preview content can be newer than the last built snapshot.
    // Don't attach fabricated dimensions or an unrelated image to that record.
    console.warn("OG source not in build manifest; rebuild required:", source);
  }
  return {
    ogImage: generated?.url || source,
    ogImageAlt: record.image ? record.imageAlt || "" : "",
    ogImageWidth: generated?.width,
    ogImageHeight: generated?.height,
  };
}
