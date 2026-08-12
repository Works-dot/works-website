import { useParams } from "wouter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Search, HelpCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { CtaBannerView } from "@/components/sections/CtaBanner";
import { MobileCarousel } from "@/components/ui/MobileCarousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getServiceBySlug as fetchServiceBySlug, getProjects } from "@/lib/strapi";
import type { Service, Project, SectionIntro } from "@/lib/strapi";
import { fallbackProjects, fallbackServices, bgGraphic1FallbackImg, bgGraphic2FallbackImg, heroBackgroundFallbackImg } from "@/data/fallback";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 }
};

function IconBox({ icon, className = "" }: { icon?: string; className?: string }) {
  return (
    <div className={`w-7 h-7 text-works-primary flex items-center justify-center shrink-0 ${className}`}>
      {icon ? (
        <img src={icon} alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
      ) : (
        <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
      )}
    </div>
  );
}

function SectionHeading({ intro, fallbackHeading }: { intro: SectionIntro | null; fallbackHeading: string }) {
  return (
    <motion.div {...fadeUp} className="mb-12 max-w-3xl">
      {intro?.kicker && (
        <span className="text-works-primary font-bold text-sm tracking-widest uppercase mb-3 block">
          {intro.kicker}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-works-dark">
        {intro?.heading || fallbackHeading}
      </h2>
      {intro?.description && (
        <p className="text-lg text-works-dark/60 leading-relaxed mt-4">
          {intro.description}
        </p>
      )}
    </motion.div>
  );
}

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const fallbackService = fallbackServices.find((s) => s.slug === slug) || null;
  const { data: service, loading: svcLoading, error: svcError } = useStrapiQuery<Service | null>(
    `service-${slug}`,
    () => fetchServiceBySlug(slug || ""),
    fallbackService
  );
  const { data: projects } = useStrapiQuery<Project[]>("projects", getProjects, fallbackProjects);

  const bgGraphic = bgGraphic1FallbackImg;
  const bgGraphic2 = bgGraphic2FallbackImg;

  if (svcLoading) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
        <Header />
        <main className="flex-grow pt-28 lg:pt-32 flex items-center justify-center">
          <div className="animate-pulse text-works-dark/30 text-lg">Betöltés...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (svcError) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
        <Header />
        <main className="flex-grow pt-28 lg:pt-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-works-dark mb-4">Hiba történt</h1>
            <p className="text-works-dark/60 mb-6">A tartalom betöltése sikertelen. Kérjük, próbáld újra később.</p>
            <Link href="/" className="text-works-primary font-semibold hover:underline">Vissza a főoldalra</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
        <Header />
        <main className="flex-grow pt-28 lg:pt-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-works-dark mb-4">
              Szolgáltatás nem található
            </h1>
            <Link href="/" className="text-works-primary font-semibold hover:underline">
              Vissza a főoldalra
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const heroGraphic = heroBackgroundFallbackImg;

  const relatedProjects = service.relatedProjectSlugs
    .map(s => (projects || []).find(p => p.slug === s))
    .filter(Boolean) as Project[];

  const questions = service.questionsSection;
  const help = service.helpSection;
  const process = service.processSection;
  const deliverables = service.deliverablesSection;
  const faq = service.faqSection;
  const relatedServices = service.relatedServices || [];

  const showDeliverables =
    !!deliverables &&
    (deliverables.variant === "largeCards"
      ? deliverables.largeCards.length > 0
      : deliverables.smallCards.length > 0);

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        {/* 1. Hero */}
        <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 bg-white overflow-hidden">
          {heroGraphic && (
            <img
              src={heroGraphic}
              alt=""
              aria-hidden="true"
              className="absolute top-[70px] -right-[15%] w-[70vw] lg:-top-[100px] lg:-right-40 lg:w-[800px] opacity-10 lg:opacity-100 pointer-events-none select-none lg:rotate-12"
            />
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <span className="text-works-primary font-bold text-sm tracking-widest uppercase mb-4 block">
                {service.subtitle}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-works-dark mb-6 leading-tight">
                {service.title}.
              </h1>
              <p className="text-lg lg:text-xl text-works-dark/60 leading-relaxed">
                {service.heroDescription}
              </p>
            </motion.div>
          </div>
        </section>

        {/* 2. Milyen kérdésekre segítünk választ találni? */}
        {questions && questions.cards.length > 0 && (
          <section className="py-20 lg:py-28 bg-works-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading intro={questions.intro} fallbackHeading="Milyen kérdésekre segítünk választ találni?" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {questions.cards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="bg-white p-6 border border-works-muted/30 border-b-2 border-b-works-primary hover:shadow-lg transition-all duration-300"
                  >
                    <HelpCircle className="w-6 h-6 text-works-primary mb-4" strokeWidth={1.5} aria-hidden="true" />
                    <h3 className="text-lg font-bold text-works-dark mb-3 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-works-dark/60 leading-relaxed text-sm">
                      {card.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3. Miben tudunk segíteni? */}
        {help && help.cards.length > 0 && (
          <section className="py-20 lg:py-28 bg-works-light relative overflow-hidden">
            {bgGraphic && (
              <img
                src={bgGraphic}
                alt=""
                aria-hidden="true"
                className="absolute -bottom-32 -left-40 w-[500px] md:w-[650px] lg:w-[800px] opacity-30 pointer-events-none select-none z-0"
              />
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <SectionHeading intro={help.intro} fallbackHeading="Miben tudunk segíteni?" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {help.cards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                    className="bg-white p-6 border border-works-muted/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <IconBox icon={card.icon} />
                      <h3 className="text-lg font-bold text-works-dark">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-works-dark/60 leading-relaxed text-sm">
                      {card.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Hogyan dolgozunk? */}
        {process && process.steps.length > 0 && (
          <section className="py-20 lg:py-28 relative overflow-hidden">
            {bgGraphic2 && (
              <img
                src={bgGraphic2}
                alt=""
                aria-hidden="true"
                className="absolute -bottom-32 -right-40 w-[350px] md:w-[455px] lg:w-[560px] opacity-25 pointer-events-none select-none z-0"
              />
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto">
                <SectionHeading intro={process.intro} fallbackHeading="Hogyan dolgozunk?" />
                <ol className="relative">
                  {process.steps.map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="relative pl-16 pb-10 last:pb-0"
                    >
                      {i < process.steps.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[19px] top-12 bottom-2 w-px bg-works-muted"
                        />
                      )}
                      <span className="absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-works-primary text-works-primary bg-transparent font-bold flex items-center justify-center text-sm">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-xl font-bold text-works-dark mb-2">
                        {step.title}
                      </h3>
                      <p className="text-works-dark/60 leading-relaxed">
                        {step.description}
                      </p>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* 5. Amit a projektből kapsz */}
        {showDeliverables && deliverables && (
          <section className="py-20 lg:py-28 bg-works-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading intro={deliverables.intro} fallbackHeading="Amit a projektből kapsz" />
              {deliverables.variant === "largeCards" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {deliverables.largeCards.map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.15 }}
                      className="bg-white p-6 md:p-8 border border-works-muted/30 flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <IconBox icon={card.icon} />
                        <h3 className="text-xl font-bold text-works-dark">
                          {card.title}
                        </h3>
                      </div>
                      {card.description && (
                        <p className="text-works-dark/60 leading-relaxed mb-5">
                          {card.description}
                        </p>
                      )}
                      {card.bullets.length > 0 && (
                        <ul className="space-y-3 mt-auto">
                          {card.bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-3 text-works-dark/80">
                              <ArrowRight className="w-4 h-4 text-works-primary shrink-0 mt-1" strokeWidth={2} />
                              <span className="leading-relaxed text-sm">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deliverables.smallCards.map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                      className="bg-white p-6 border border-works-muted/30"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <IconBox icon={card.icon} />
                        <h3 className="text-lg font-bold text-works-dark">
                          {card.title}
                        </h3>
                      </div>
                      <p className="text-works-dark/60 leading-relaxed text-sm">
                        {card.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. CTA banner */}
        {service.ctaBanner?.heading && (
          <CtaBannerView
            heading={service.ctaBanner.heading}
            ctaText={service.ctaBanner.ctaText || "Segíthetünk?"}
            ctaLink={service.ctaBanner.ctaLink || "/kapcsolat"}
          />
        )}

        {/* 7. Projektpéldák */}
        {relatedProjects.length > 0 && (
          <section className="py-20 lg:py-28 bg-works-bg border-t border-works-muted/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading intro={service.projectExamplesIntro} fallbackHeading="Projektpéldák" />
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {relatedProjects.map((p, i) => (
                  <RelatedProjectCard key={p.slug} p={p} i={i} />
                ))}
              </div>
              <MobileCarousel className="md:hidden" ariaLabel="Projektpéldák">
                {relatedProjects.map((p, i) => (
                  <RelatedProjectCard key={p.slug} p={p} i={i} animated={false} />
                ))}
              </MobileCarousel>
            </div>
          </section>
        )}

        {/* 7. GYIK */}
        {faq && faq.items.length > 0 && (
          <section className="py-20 lg:py-28 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading intro={faq.intro} fallbackHeading="Gyakran ismételt kérdések" />
              <motion.div {...fadeUp}>
                <Accordion type="single" collapsible className="space-y-3">
                  {faq.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="border border-works-muted/30 bg-works-bg px-6 data-[state=open]:border-works-primary/30"
                    >
                      <AccordionTrigger className="text-left text-base md:text-lg font-bold text-works-dark hover:text-works-primary hover:no-underline py-5">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-works-dark/60 leading-relaxed text-base pb-5">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </div>
          </section>
        )}

        {/* 8. Kapcsolódó szolgáltatások */}
        {relatedServices.length > 0 && (
          <section className="py-20 lg:py-28 bg-works-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading intro={service.relatedServicesIntro} fallbackHeading="Kapcsolódó szolgáltatások" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedServices.map((rel, i) => (
                  <motion.div
                    key={rel.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Link href={`/szolgaltatasok/${rel.slug}`} className="block h-full">
                      <div className="bg-white/60 backdrop-blur-sm p-6 border border-works-muted/30 hover:bg-white hover:border-works-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-7 h-7 text-works-primary flex items-center justify-center shrink-0">
                            {rel.icon ? (
                              <img src={rel.icon} alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
                            ) : (
                              <Search className="w-6 h-6" strokeWidth={1.5} />
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-works-dark group-hover:text-works-primary transition-colors">
                            {rel.title}
                          </h3>
                        </div>
                        <p className="text-works-dark/60 leading-relaxed flex-grow text-sm">
                          {rel.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function RelatedProjectCard({ p, i, animated = true }: { p: Project; i: number; animated?: boolean }) {
  return (
    <motion.article
      {...(animated
        ? {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-50px" },
            transition: { duration: 0.5, delay: i * 0.15 },
          }
        : {})}
      className="h-full flex flex-col group bg-white overflow-hidden border border-works-muted/30 hover:border-works-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/projektek/${p.slug}`} className="flex flex-col flex-grow">
        <div className="w-full aspect-[4/3] relative overflow-hidden bg-works-light">
          <img
            src={p.image}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-6 sm:p-8 flex flex-col flex-grow">
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {p.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs font-semibold text-works-primary border border-works-primary bg-transparent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-works-dark mb-3 line-clamp-2 group-hover:text-works-primary transition-colors">
            {p.title}
          </h3>
          <p className="text-works-dark/60 mb-6 line-clamp-3 leading-relaxed">
            {p.description}
          </p>
          <span className="inline-flex items-center text-works-dark font-semibold text-sm group-hover:text-works-primary mt-auto">
            Megnézem az esettanulmányt
            <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
