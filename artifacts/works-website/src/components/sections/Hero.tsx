import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getHomepage } from "@/lib/strapi";
import type { HomepageData } from "@/lib/strapi";
import { fallbackHomepage } from "@/data/fallback";
import { useI18n } from "@/i18n";
import { buildLocalePath, localizeInternalPath } from "@/lib/i18n-routes";
import { PrimaryAction } from "@/components/ui/button";
import { FullBleedHero } from "@/components/ui/FullBleedHero";
import { TermText } from "@/components/Terminology";
import homeHeroImage from "@/assets/heroes/Hero_home_1789027068381.png";
import homeMobileHeroImage from "@/assets/heroes/Hero_home_mobile_1789374396075.png";

function renderHeading(heading: string, highlightedWord: string) {
  if (!highlightedWord || !heading.includes(highlightedWord)) {
    return <TermText>{heading}</TermText>;
  }
  const idx = heading.indexOf(highlightedWord);
  const before = heading.slice(0, idx);
  const after = heading.slice(idx + highlightedWord.length);
  return (
    <>
      {before && <TermText>{before}</TermText>}
      <span className="text-white"><TermText>{highlightedWord}</TermText></span>
      {after && <TermText>{after}</TermText>}
    </>
  );
}

export function Hero() {
  const { locale } = useI18n();
  const { data: homepage } = useStrapiQuery<HomepageData>("homepage", () => getHomepage(locale), fallbackHomepage, locale);
  const hero = homepage?.hero;

  const heading = hero?.heading || (locale === "hu" ? "Digitális élményeket tervezünk" : "");
  const highlightedWord = hero?.highlightedWord || (locale === "hu" ? "élményeket" : "");
  const description = hero?.description || (locale === "hu" ? "UX kutatás, UI design és fejlesztés — egy csapattól. Segítünk, hogy digitális termékeid valódi értéket teremtsenek." : "");
  const primaryCtaText = hero?.primaryCtaText || (locale === "hu" ? "Projektjeink" : "");
  const primaryCtaLink = hero?.primaryCtaLink || "#projects";
  const secondaryCtaText = hero?.secondaryCtaText || (locale === "hu" ? "Kapcsolat" : "");
  const secondaryCtaLink = localizeInternalPath(locale, hero?.secondaryCtaLink || buildLocalePath(locale, "contact"));
  return (
    <FullBleedHero backgroundImage={homeHeroImage} mobileBackgroundImage={homeMobileHeroImage}>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-8">
        {renderHeading(heading, highlightedWord)}
      </h1>

      <p className="text-xl sm:text-2xl text-white mb-10 leading-relaxed max-w-xl">
        <TermText>{description}</TermText>
      </p>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-5">
        <PrimaryAction
          asChild
          size="hero"
          className="border border-white/70 text-base sm:text-lg whitespace-normal focus-visible:ring-white focus-visible:ring-offset-works-dark"
        >
          <a href={localizeInternalPath(locale, primaryCtaLink)}>
            <TermText>{primaryCtaText}</TermText>
          </a>
        </PrimaryAction>
        <a
          href={secondaryCtaLink}
          className="inline-flex justify-center items-center px-8 py-4 font-semibold text-white border border-white/70 hover:border-white hover:bg-white hover:text-works-dark transition-all duration-300 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-works-dark"
        >
          <TermText>{secondaryCtaText}</TermText>
        </a>
      </div>
    </FullBleedHero>
  );
}
