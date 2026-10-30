import type { ImgHTMLAttributes } from "react";
import imageManifest from "@/data/image-manifest";
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

/** No wrapper: preserves flex/grid/absolute positioning of existing img nodes. */
export function ManagedImage({ src, sizes = "100vw", loading = "lazy", ...props }: ResponsiveImageProps) {
  const image = getResponsiveImageSource(src);
  return <img {...props} src={image?.srcSet ? image.src : src}
    srcSet={image?.srcSet || undefined} sizes={image?.srcSet ? sizes : undefined}
    width={image?.width ?? props.width} height={image?.height ?? props.height}
    loading={loading} decoding="async" />;
}

function withoutQuery(source: string): string {
  return source.split(/[?#]/, 1)[0];
}

function findLocalManifestEntry(source: string): OptimizedImageManifestEntry | undefined {
  const cleanSource = withoutQuery(source);
  let filename = cleanSource.slice(cleanSource.lastIndexOf("/") + 1);
  try { filename = decodeURIComponent(filename); } catch { return undefined; }
  if (!filename) return undefined;

  const locals = Object.entries(imageManifest).filter(([key]) => key.startsWith("local:")).map(([, entry]) => entry);
  const exact = locals.find(entry => entry.source.slice(entry.source.lastIndexOf("/") + 1) === filename);
  if (exact) return exact;
  for (const entry of locals) {
    const originalName = entry.source.slice(entry.source.lastIndexOf("/") + 1);
    const extension = originalName.lastIndexOf(".");
    const stem = extension === -1 ? originalName : originalName.slice(0, extension);
    const suffix = originalName.slice(extension);
    const viteHash = filename.slice(stem.length + 1, filename.length - suffix.length);
    if (filename.startsWith(`${stem}-`) && filename.endsWith(suffix) && /^[\w-]{8}$/.test(viteHash)) {
      return entry;
    }
  }
  return undefined;
}

export function getResponsiveImageSource(source: string): ResponsiveImageSource | undefined {
  if (!source) return undefined;
  const cleanSource = withoutQuery(source);
  const exact = imageManifest[cleanSource];
  // Do not match an unindexed CMS filename to a similarly named local asset.
  const resolved = exact || (!cleanSource.includes("/uploads/") ? findLocalManifestEntry(cleanSource) : undefined);
  if (!resolved) return undefined;
  // The dev command intentionally does not generate Git-ignored /media files.
  // Retain intrinsic dimensions from the manifest without requiring those files.
  if (!import.meta.env.PROD) return { ...resolved, src: source, srcSet: "", original: source };
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
  if (!responsive?.srcSet) return null;
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
  sizes = "100vw",
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
        src={responsive?.srcSet ? responsive.src : src}
        srcSet={responsive?.srcSet || undefined}
        sizes={responsive?.srcSet ? sizes : undefined}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        width={props.width ?? responsive?.width}
        height={props.height ?? responsive?.height}
        decoding="async"
      />
    </picture>
  );
}