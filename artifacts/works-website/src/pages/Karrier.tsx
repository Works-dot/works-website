import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getCareerPositions, getCareerPage } from "@/lib/strapi";
import type { CareerPosition, CareerPageData } from "@/lib/strapi";
import { fallbackPositions, fallbackCareerPage } from "@/data/fallback";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { FullBleedHero } from "@/components/ui/FullBleedHero";
import { TermText } from "@/components/Terminology";
import { CareerValues } from "@/components/sections/CareerValues";
import careerHeroImage from "@/assets/heroes/Hero_career_1789027068381.png";
import careerMobileHeroImage from "@/assets/heroes/Hero_career_mobile_1789374396078.png";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Karrier() {
  const { locale, t } = useI18n();
  const { data: positions, loading: posLoading, error: posError } = useStrapiQuery<CareerPosition[]>("careerPositions", () => getCareerPositions(locale), fallbackPositions, locale);
  const { data: careerPage } = useStrapiQuery<CareerPageData>("careerPage", () => getCareerPage(locale), fallbackCareerPage, locale);

  const workWithUs = careerPage?.workWithUs;
  const whyUs = careerPage?.whyUs;

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <FullBleedHero backgroundImage={careerHeroImage} mobileBackgroundImage={careerMobileHeroImage} showDecoration>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            <TermText>{careerPage?.hero?.heading || t("pages.karrierHeading")}</TermText>
          </h1>
          <p className="text-lg lg:text-xl text-white leading-relaxed">
            <TermText>{careerPage?.hero?.description || (locale === "hu" ? "Csatlakozz egy csapathoz, ahol a design kutatáson alapul, a technológia az embereket szolgálja, és minden nap tanulhatsz valami újat." : "")}</TermText>
          </p>
        </FullBleedHero>

        <section className="py-20 lg:py-28 bg-works-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight mb-6">
                <TermText>{workWithUs?.heading || (locale === "hu" ? "Dolgozz velünk" : "")}</TermText>
              </h2>
              {(workWithUs?.description || "").split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-lg text-works-dark/70 leading-relaxed mb-4">
                  <TermText>{paragraph}</TermText>
                </p>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight mb-16">
                <TermText>{t("pages.openPositionsHeading")}</TermText>
              </h2>
            </motion.div>

            {posError ? (
              <div className="text-center py-16">
                <p className="text-xl font-semibold text-works-dark mb-2"><TermText>{t("states.errorHeading")}</TermText></p>
                <p className="text-works-dark/60"><TermText>{t("states.errorBody")}</TermText></p>
              </div>
            ) : posLoading ? (
              <div className="divide-y divide-works-dark/10">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse py-6 lg:py-8">
                    <div className="h-7 bg-works-muted/30 w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-works-dark/10">
                {(positions || []).map((position, i) => (
                  <motion.div
                    key={position.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                  >
                    <Link
                      href={buildLocalePath(locale, "careerDetail", position.slug)}
                      className="flex items-center justify-between py-6 lg:py-8 px-1 group"
                    >
                      <h3 className="text-xl lg:text-2xl font-bold text-works-dark group-hover:text-works-primary transition-colors">
                        <TermText>{position.title}</TermText>
                      </h3>
                      <ArrowRight className="w-5 h-5 text-works-primary flex-shrink-0 ml-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <CareerValues values={whyUs} />
      </main>

      <Footer />
    </div>
  );
}
