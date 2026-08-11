/**
 * Renders an uploaded icon as a CSS mask so its fill color comes from the
 * element's background-color. Unlike CSS filter chains, this produces the
 * exact same brand color in every browser (desktop and mobile WebKit alike).
 * The icon file's alpha channel defines the shape; works for SVG and PNG.
 */
export function MaskIcon({ src, className = "" }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
