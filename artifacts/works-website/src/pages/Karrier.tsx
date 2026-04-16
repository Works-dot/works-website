import { useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getCareerPositions, getCareerPage } from "@/lib/strapi";
import type { CareerPosition, CareerPageData } from "@/lib/strapi";
import { fallbackPositions, fallbackCareerPage, careerGraphicFallbackImg } from "@/data/fallback";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Karrier() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: positions, loading: posLoading, error: posError } = useStrapiQuery<CareerPosition[]>("careerPositions", getCareerPositions, fallbackPositions);
  const { data: careerPage } = useStrapiQuery<CareerPageData>("careerPage", getCareerPage, fallbackCareerPage);

  const contactGraphic = careerGraphicFallbackImg;
  const workWithUs = careerPage?.workWithUs;
  const whyUs = careerPage?.whyUs;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector("div")?.offsetWidth || 400;
    const scrollAmount = cardWidth + 24;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-44 bg-white overflow-hidden">
          {contactGraphic && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="absolute top-[70px] -right-[15%] w-[70vw] h-auto lg:top-auto lg:right-10 lg:bottom-0 lg:w-auto lg:h-[calc(100%-44px)] pointer-events-none select-none z-0"
            >
              <img
                src={contactGraphic}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain opacity-10 lg:opacity-100"
              />
            </motion.div>
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl lg:max-w-lg"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-works-dark mb-6 leading-tight">
                Karrier.
              </h1>
              <p className="text-lg lg:text-xl text-works-dark/60 leading-relaxed">
                Csatlakozz egy csapathoz, ahol a design kutatáson alapul, a technológia az embereket szolgálja, és minden nap tanulhatsz valami újat.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight mb-6">
                {workWithUs?.heading || "Dolgozz velünk"}
              </h2>
              {(workWithUs?.description || "").split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-lg text-works-dark/70 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight mb-16">
                Nyitott pozíciók
              </h2>
            </motion.div>

            {posError ? (
              <div className="text-center py-16">
                <p className="text-xl font-semibold text-works-dark mb-2">Hiba történt</p>
                <p className="text-works-dark/60">A pozíciók betöltése sikertelen. Kérjük, próbáld újra később.</p>
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
                      href={`/karrier/${position.slug}`}
                      className="flex items-center justify-between py-6 lg:py-8 px-1 group"
                    >
                      <h3 className="text-xl lg:text-2xl font-bold text-works-dark group-hover:text-works-primary transition-colors">
                        {position.title}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-works-primary flex-shrink-0 ml-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-bg overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="flex items-end justify-between mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight">
                {whyUs?.sectionHeading || "Miért jó nálunk dolgozni?"}
              </h2>
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => scroll("left")}
                  className="w-12 h-12 flex items-center justify-center border border-works-dark/10 hover:border-works-primary hover:text-works-primary transition-colors"
                  aria-label="Előző"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="w-12 h-12 flex items-center justify-center border border-works-dark/10 hover:border-works-primary hover:text-works-primary transition-colors"
                  aria-label="Következő"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(whyUs?.items || []).map((card, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[calc(50vw-2rem)] lg:w-[calc(33.333vw-2rem)] snap-start${i === 0 ? " ml-4 sm:ml-6 lg:ml-8" : ""}`}
                >
                  <div className="bg-white border border-works-dark/5 overflow-hidden h-full">
                    <div className="aspect-[16/10] overflow-hidden bg-works-muted/20">
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-works-dark/10">
                          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="p-6 lg:p-8">
                      <h3 className="text-xl font-bold text-works-dark mb-3">
                        {card.title}
                      </h3>
                      <p className="text-works-dark/60 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
