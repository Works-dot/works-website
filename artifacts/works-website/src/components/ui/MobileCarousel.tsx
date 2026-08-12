import { Children, ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface MobileCarouselProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/**
 * Mobile-only horizontal snap carousel with dot indicators.
 * Layout mirrors the Karrier "céges értékeink" peek pattern (next card
 * peeks in from the right) and the About gallery dot indicator
 * (active dot = elongated red bar). No arrows.
 *
 * The track breaks out of the standard `px-4 sm:px-6` content band so
 * cards can bleed to the screen edge. Callers should hide it on
 * desktop via className="md:hidden" (or similar).
 */
export function MobileCarousel({ children, className = "", ariaLabel }: MobileCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const count = Children.count(children);

  const getItems = () => {
    const track = trackRef.current;
    return track ? (Array.from(track.children) as HTMLElement[]) : [];
  };

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    const items = getItems();
    if (!track || items.length === 0) return;
    const base = items[0].offsetLeft;
    const pos = track.scrollLeft;
    let nearest = 0;
    let bestDist = Infinity;
    items.forEach((el, i) => {
      const dist = Math.abs(el.offsetLeft - base - pos);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = i;
      }
    });
    setSelected(nearest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (index: number) => {
    const track = trackRef.current;
    const items = getItems();
    if (!track || !items[index]) return;
    track.scrollTo({
      left: items[index].offsetLeft - items[0].offsetLeft,
      behavior: "smooth",
    });
  };

  return (
    <div className={className} role="region" aria-label={ariaLabel}>
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 scroll-px-4 sm:scroll-px-6 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {Children.map(children, (child) => (
          <div className="flex-shrink-0 w-[calc(100vw-3.5rem)] snap-start min-w-0">
            {child}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ugrás a(z) ${i + 1}. elemre`}
              aria-current={i === selected ? "true" : undefined}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === selected
                  ? "w-8 bg-works-primary"
                  : "w-2 bg-works-dark/20 hover:bg-works-dark/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
