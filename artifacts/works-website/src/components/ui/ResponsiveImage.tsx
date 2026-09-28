import type { ImgHTMLAttributes } from "react";
import imageManifest, {
  optimizedCmsImageVariants,
} from "@/data/image-manifest";
import type { OptimizedImageManifestEntry } from "@/data/image-manifest-types";

type ImageLoading = "eager" | "lazy";
type ImagePriority = "high" | "low" | "auto";

export interface ResponsiveImageSource extends OptimizedImageManifestEntry {
  original: string;
}

export interface ResponsiveImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "fetchPriority"> {
  src: string;
  loading?: ImageLoading;
  fetchPriority?: ImagePriority;
  sizes?: string;
  pictureClassName?: string;
  /** Optional second source used for approved mobile art direction. */
  mobileSource?: string;
  mobileMedia?: string;
}

function withoutQuery(source: string): string {
  return source.split(/[?#]/, 1)[0];
}

function findLocalManifestEntry(source: string): OptimizedImageManifestEntry | undefined {
  const cleanSource = withoutQuery(source);
  const filename = cleanSource.slice(cleanSource.lastIndexOf("/") + 1);
  if (!filename) return undefined;

  for (const [key, entry] of Object.entries(imageManifest)) {
    if (!key.startsWith("local:")) continue;
    const originalName = entry.source.slice(entry.source.lastIndexOf("/") + 1);
    const extension = originalName.lastIndexOf(".");
    const stem = extension === -1 ? originalName : originalName.slice(0, extension);
    if (
      filename === originalName ||
      filename.startsWith(`${stem}-`) ||
      cleanSource.endsWith(`/${originalName}`)
    ) {
      return entry;
    }
  }
  return undefined;
}

function safeSourceName(source: string): string {
  return source.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function getCmsImageSource(source: string): OptimizedImageManifestEntry | undefined {
  const cleanSource = withoutQuery(source);
  if (!cleanSource.startsWith("/strapi/uploads/")) {
    return undefined;
  }
  const variants = optimizedCmsImageVariants[cleanSource];
  if (!variants) return undefined;
  const filename = cleanSource.slice("/strapi/uploads/".length);
  const extension = filename.lastIndexOf(".");
  if (extension < 1) return undefined;
  const baseName = safeSourceName(filename.slice(0, extension));
  const sources = variants.map(
    ([hash, width]) => `/media/uploads/${baseName}-${hash}-${width}.webp ${width}w`,
  );
  return {
    source: cleanSource,
    src: sources[sources.length - 1].split(" ")[0],
    srcSet: sources.join(", "),
  };
}

export function getResponsiveImageSource(source: string): ResponsiveImageSource | undefined {
  if (!source) return undefined;
  const cleanSource = withoutQuery(source);
  const exact = imageManifest[cleanSource];
  const entry =
    (import.meta.env.PROD && exact) ||
    (import.meta.env.PROD && getCmsImageSource(cleanSource)) ||
    undefined;
  const localEntry =
    import.meta.env.PROD && findLocalManifestEntry(cleanSource);
  const resolved = entry || localEntry;
  if (!resolved) return undefined;
  return { ...resolved, original: source };
}

function Source({
  source,
  sizes,
  media,
}: {
  source: string;
  sizes?: string;
  media?: string;
}) {
  const responsive = getResponsiveImageSource(source);
  if (!responsive) return null;
  return (
    <source
      type="image/webp"
      srcSet={responsive.srcSet}
      sizes={sizes}
      media={media}
    />
  );
}

export function ResponsiveImage({
  src,
  alt,
  className,
  pictureClassName,
  loading = "lazy",
  fetchPriority = "auto",
  sizes,
  mobileSource,
  mobileMedia = "(width < 768px)",
  ...props
}: ResponsiveImageProps) {
  const responsive = getResponsiveImageSource(src);
  return (
    <picture className={pictureClassName}>
      {mobileSource && (
        <Source source={mobileSource} sizes={sizes} media={mobileMedia} />
      )}
      {mobileSource && <source media={mobileMedia} srcSet={mobileSource} />}
      <Source source={src} sizes={sizes} />
      <img
        {...props}
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={responsive?.width}
        height={responsive?.height}
        decoding="async"
      />
    </picture>
  );
}