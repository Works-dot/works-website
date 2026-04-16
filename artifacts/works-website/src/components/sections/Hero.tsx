import { motion } from "framer-motion";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getHomepage } from "@/lib/strapi";
import type { HomepageData } from "@/lib/strapi";
import { fallbackHomepage, heroBackgroundFallbackImg } from "@/data/fallback";

function renderHeading(heading: string, highlightedWord: string) {
  if (!highlightedWord || !heading.includes(highlightedWord)) {
    return <>{heading}</>;
  }
  const idx = heading.indexOf(highlightedWord);
  const before = heading.slice(0, idx);
  const after = heading.slice(idx + highlightedWord.length);
  return (
    <>
      {before}
      <span className="text-works-primary">{highlightedWord}</span>
      {after}
    </>
  );
}

export function Hero() {
  const { data: homepage } = useStrapiQuery<HomepageData>("homepage", getHomepage, fallbackHomepage);
  const hero = homepage?.hero;

  const heading = hero?.heading || "Digitális élményeket tervezünk";
  const highlightedWord = hero?.highlightedWord || "élményeket";
  const description = hero?.description || "UX kutatás, UI design és fejlesztés — egy csapattól. Segítünk, hogy digitális termékeid valódi értéket teremtsenek.";
  const primaryCtaText = hero?.primaryCtaText || "Projektjeink";
  const primaryCtaLink = hero?.primaryCtaLink || "#projects";
  const secondaryCtaText = hero?.secondaryCtaText || "Kapcsolat";
  const secondaryCtaLink = hero?.secondaryCtaLink || "/kapcsolat";
  const heroGraphic = heroBackgroundFallbackImg;

  return (
    <section className="relative md:h-screen pt-[72px] bg-works-bg overflow-hidden flex">
      {heroGraphic && (
        <img
          src={heroGraphic}
          alt=""
          aria-hidden="true"
          className="absolute top-[72px] -right-[15%] w-[70vw] h-auto opacity-10 md:hidden pointer-events-none select-none z-0"
        />
      )}
      <div className="relative z-10 w-full md:w-1/2 flex items-center pl-4 sm:pl-6 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] pr-4 sm:pr-6 lg:pr-8 py-10 md:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[80px] font-bold text-works-dark tracking-tight leading-[1.05] mb-8">
            {renderHeading(heading, highlightedWord)}
          </h1>

          <p className="text-xl sm:text-2xl text-works-dark/60 mb-10 leading-relaxed max-w-xl">
            {description}
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <a
              href={primaryCtaLink}
              className="inline-flex justify-center items-center px-6 sm:px-8 py-4 font-semibold bg-works-primary text-white border border-works-primary hover:bg-works-primary/90 transition-all duration-300 text-base sm:text-lg whitespace-nowrap"
            >
              {primaryCtaText}
            </a>
            <a
              href={secondaryCtaLink}
              className="inline-flex justify-center items-center px-8 py-4 font-semibold text-works-dark border border-works-muted hover:border-works-dark transition-all duration-300 text-lg"
            >
              {secondaryCtaText}
            </a>
          </div>
        </motion.div>
      </div>

      <div className="hidden md:flex w-1/2 items-center justify-center">
        {heroGraphic && (
          <motion.img
            src={heroGraphic}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: [0.8, 1.06, 1], rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut", scale: { duration: 1.4, delay: 0.2, times: [0, 0.7, 1], ease: ["easeIn", "easeOut"] } }}
            className="w-full h-auto -mt-[30px] -mr-[150px] pointer-events-none select-none"
          />
        )}
      </div>
    </section>
  );
}
