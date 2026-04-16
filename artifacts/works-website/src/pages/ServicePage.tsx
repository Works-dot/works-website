import { useParams } from "wouter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getServiceBySlug as fetchServiceBySlug, getProjects } from "@/lib/strapi";
import type { Service, Project } from "@/lib/strapi";
import { fallbackProjects, fallbackServices, bgGraphic1FallbackImg, bgGraphic2FallbackImg, heroBackgroundFallbackImg, serviceBgFallbackImg } from "@/data/fallback";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 }
};

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
  const serviceMockup = service.heroImage || serviceBgFallbackImg;

  const relatedProjects = service.relatedProjectSlugs
    .map(s => (projects || []).find(p => p.slug === s))
    .filter(Boolean) as Project[];

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-28 bg-white overflow-hidden">
          {heroGraphic && (
            <img
              src={heroGraphic}
              alt=""
              aria-hidden="true"
              className="absolute top-[70px] -right-[15%] w-[70vw] lg:-top-[100px] lg:-right-40 lg:w-[800px] opacity-10 lg:opacity-100 pointer-events-none select-none lg:rotate-12"
            />
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:w-1/2"
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
                <h3 className="hidden lg:block text-2xl md:text-3xl font-bold text-works-dark leading-snug lg:mt-[150px]">
                  {service.valueQuestion}
                </h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="lg:w-1/2 flex flex-col items-center lg:items-end"
              >
                {serviceMockup && (
                  <img
                    src={serviceMockup}
                    alt=""
                    aria-hidden="true"
                    className="w-full max-w-sm lg:max-w-md xl:max-w-lg object-contain"
                  />
                )}
                <p className="hidden lg:block text-2xl md:text-3xl text-works-primary italic leading-relaxed mt-6 lg:mt-8 max-w-md lg:max-w-lg xl:max-w-xl">
                  {service.valueAnswer}
                </p>
              </motion.div>
            </div>

            <div className="lg:hidden mt-10 space-y-6">
              <h3 className="text-2xl font-bold text-works-dark leading-snug">
                {service.valueQuestion}
              </h3>
              <p className="text-2xl text-works-primary italic leading-relaxed">
                {service.valueAnswer}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-12">
                Mit csinálunk?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.activities.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white p-6 border border-works-muted/30 hover:border-works-primary/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-works-bg text-works-primary flex items-center justify-center shrink-0 group-hover:bg-works-primary group-hover:text-white transition-all duration-300">
                      {activity.icon ? (
                        <img src={activity.icon} alt="" className="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(23%)_sepia(93%)_saturate(2568%)_hue-rotate(337deg)_brightness(91%)_contrast(92%)] group-hover:[filter:brightness(0)_invert(1)]" />
                      ) : (
                        <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-works-dark group-hover:text-works-primary transition-colors">
                      {activity.title}
                    </h3>
                  </div>
                  <p className="text-works-dark/60 leading-relaxed text-sm">
                    {activity.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

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
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-12">
                Miért válassz minket?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {service.benefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="border border-works-muted/30 bg-white/60 backdrop-blur-sm p-6 md:p-8 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {benefit.icon ? (
                      <div className="w-9 h-9 bg-works-bg text-works-primary flex items-center justify-center shrink-0 group-hover:bg-works-primary group-hover:text-white transition-all duration-300">
                        <img src={benefit.icon} alt="" className="w-5 h-5 [filter:brightness(0)_saturate(100%)_invert(23%)_sepia(93%)_saturate(2568%)_hue-rotate(337deg)_brightness(91%)_contrast(92%)] group-hover:[filter:brightness(0)_invert(1)]" />
                      </div>
                    ) : null}
                    <h3 className="text-xl font-bold text-works-dark">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-works-dark/60 leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark">
                Milyen eszközöket használunk?
              </h2>
            </motion.div>
          </div>

          <div className="relative w-full flex overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-works-bg to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-works-bg to-transparent z-10 pointer-events-none" />

            <div className="flex w-max animate-[marquee_50s_linear_infinite] group-hover:[animation-play-state:paused]">
              {[...service.tools, ...service.tools].map((tool, i) => (
                <span key={i} className="flex-shrink-0 flex items-center">
                  <span className="text-xl md:text-2xl font-semibold text-works-dark whitespace-nowrap">
                    {tool.name}
                  </span>
                  <span className="mx-6 md:mx-8 text-works-muted text-lg select-none" aria-hidden="true">◆</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <CtaBanner />

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
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-10">
                Hogyan dolgozunk?
              </h2>
            </motion.div>

            {service.howWeWork && (
              <motion.div
                {...fadeUp}
                className="prose prose-lg max-w-none text-works-dark/70 [&_h3]:text-works-dark [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mb-2 [&_h3]:mt-6 first:[&_h3]:mt-0 [&_p]:leading-relaxed [&_p]:mb-4"
                dangerouslySetInnerHTML={{ __html: service.howWeWork }}
              />
            )}
          </div>
        </section>

        {relatedProjects.length > 0 && (
          <section className="py-20 lg:py-28 bg-works-bg border-t border-works-muted/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div {...fadeUp}>
                <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-16">
                  Kapcsolódó projektjeink
                </h2>
              </motion.div>

              <div className="flex flex-col gap-20">
                {relatedProjects.map((p, i) => (
                  <ProjectCard
                    key={p.slug}
                    slug={p.slug}
                    title={p.title}
                    tags={p.tags}
                    description={p.description}
                    image={p.image}
                    reverse={i % 2 !== 0}
                  />
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
