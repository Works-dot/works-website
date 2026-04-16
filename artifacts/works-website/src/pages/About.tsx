import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getTeamMembers, getGalleryImages, getAboutPage } from "@/lib/strapi";
import type { TeamMember, GalleryImage, AboutPageData } from "@/lib/strapi";
import { fallbackTeamMembers, fallbackGalleryImages, fallbackAboutPage, aboutGraphicFallbackImg, heroBackgroundFallbackImg } from "@/data/fallback";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function About() {
  const { data: teamMembers, loading: teamLoading } = useStrapiQuery<TeamMember[]>("teamMembers", getTeamMembers, fallbackTeamMembers);
  const { data: galleryImages, loading: galleryLoading } = useStrapiQuery<GalleryImage[]>("galleryImages", getGalleryImages, fallbackGalleryImages);
  const { data: aboutPage } = useStrapiQuery<AboutPageData>("aboutPage", getAboutPage, fallbackAboutPage);

  const aboutGraphic = aboutGraphicFallbackImg;
  const heroGraphic = heroBackgroundFallbackImg;

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-32 bg-white overflow-hidden">
          {heroGraphic && (
            <img
              src={heroGraphic}
              alt=""
              aria-hidden="true"
              className="absolute top-[72px] -right-[15%] w-[70vw] h-auto opacity-10 md:hidden pointer-events-none select-none z-0"
            />
          )}
          {aboutGraphic && (
            <motion.img
              src={aboutGraphic}
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="hidden md:block absolute md:right-4 lg:right-4 top-1/2 -translate-y-[40%] md:w-[55%] lg:w-[60%] max-w-[800px] pointer-events-none select-none z-0 opacity-90"
            />
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-sm md:max-w-md lg:max-w-lg"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-works-dark mb-6 leading-tight">
                Rólunk.
              </h1>
              <p className="text-lg lg:text-xl text-works-dark/60 leading-relaxed">
                Egy magyar digitális ügynökség vagyunk, akik hisznek abban, hogy a jó design kutatáson alapul, és a technológia az embereket szolgálja.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-bg relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-10">
                {aboutPage?.intro?.heading || 'Kik vagyunk?'}
              </h2>
              <p className="text-lg text-works-dark/70 leading-relaxed mb-6">
                {aboutPage?.intro?.description || 'A Works. 2018-ban indult azzal a céllal, hogy a magyar digitális piacra világszínvonalú UX kutatást és design megoldásokat hozzon. Azóta több mint 50 projekten dolgoztunk startupokkal, nagyvállalatokkal és közszféra szereplőkkel egyaránt.'}
              </p>
              <p className="text-lg text-works-dark/70 leading-relaxed">
                Hisszük, hogy a legjobb digitális termékek ott születnek, ahol az adatvezérelt kutatás találkozik a kreatív gondolkodással. Nem csak tervezünk — partnerként végigkísérjük ügyfeleinket az ötlettől a megvalósításig.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-16">
                Kollégáink
              </h2>
            </motion.div>

            {teamLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-10">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-works-muted/30 mb-3" />
                    <div className="h-4 bg-works-muted/30 w-2/3 mb-1" />
                    <div className="h-3 bg-works-muted/30 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-10">
                {(teamMembers || []).map((member, i) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.07 }}
                  >
                    <div className="aspect-square overflow-hidden mb-3 bg-works-muted/20">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-works-dark/20 text-3xl font-bold">
                          {member.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-works-dark text-sm">{member.name}</h3>
                    <p className="text-sm text-works-dark/60">{member.title}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-16">
                Works moments
              </h2>
            </motion.div>

            {galleryLoading ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="break-inside-avoid animate-pulse">
                    <div className="bg-works-muted/30 h-48" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {(galleryImages || []).filter((img) => img.src).map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="break-inside-avoid overflow-hidden"
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
