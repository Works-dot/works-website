import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResponsiveFilter } from "@/components/ui/ResponsiveFilter";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getProjects } from "@/lib/strapi";
import type { Project } from "@/lib/strapi";
import { fallbackProjects } from "@/data/fallback";

function FeaturedProjectCard({ slug, title, tags, description, image }: {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="col-span-1 md:col-span-2 lg:col-span-3"
    >
      <Link href={`/projektek/${slug}`} className="group flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
        <div className="w-full lg:w-1/2 overflow-hidden bg-works-light aspect-[4/3]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-start py-2">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-semibold text-works-primary border border-works-primary bg-transparent"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-works-dark mb-3 leading-tight group-hover:text-works-primary transition-colors">
            {title}
          </h3>
          <p className="text-base lg:text-lg text-works-dark/60 leading-relaxed mb-6">
            {description}
          </p>
          <span className="inline-flex items-center gap-2 text-works-primary font-semibold text-sm">
            Megnézem az esettanulmányt
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectGridCard({ slug, title, tags, description, image }: {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="col-span-1"
    >
      <Link href={`/projektek/${slug}`} className="group block">
        <div className="overflow-hidden bg-works-light aspect-[4/3]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="pt-5 pb-2">
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-semibold text-works-primary border border-works-primary bg-transparent"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-works-dark mb-2 leading-tight group-hover:text-works-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-works-dark/60 leading-relaxed mb-3 line-clamp-3">
            {description}
          </p>
          <span className="inline-flex items-center gap-2 text-works-primary font-semibold text-sm">
            Részletek
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Projektek() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { data: projects, loading, error } = useStrapiQuery<Project[]>("projects", getProjects, fallbackProjects);

  const allItems = projects || [];

  const usedTags = useMemo(() => {
    const tagSet = new Set<string>();
    allItems.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [allItems]);

  const filtered = useMemo(() => {
    if (!activeTag) return allItems;
    return allItems.filter((p) => p.tags.includes(activeTag));
  }, [activeTag, allItems]);

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow pt-28 lg:pt-32">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 lg:mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-works-dark tracking-tight mb-4">
                Projektjeink
              </h1>
              <p className="text-lg lg:text-xl text-works-dark/60 max-w-2xl">
                Válogatás legfrissebb munkáinkból — UX kutatástól a komplex rendszertervezésig.
              </p>
            </div>

            {!loading && usedTags.length > 0 && (
              <div className="mb-12">
                <ResponsiveFilter
                  options={usedTags}
                  value={activeTag}
                  onChange={setActiveTag}
                  allLabel="Összes projekt"
                />
              </div>
            )}

            {error ? (
              <div className="text-center py-16">
                <p className="text-xl font-semibold text-works-dark mb-2">Hiba történt</p>
                <p className="text-works-dark/60">A projektek betöltése sikertelen. Kérjük, próbáld újra később.</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-works-muted/30 aspect-[4/3] mb-4" />
                    <div className="h-4 bg-works-muted/30 w-1/3 mb-3" />
                    <div className="h-6 bg-works-muted/30 w-2/3 mb-2" />
                    <div className="h-4 bg-works-muted/30 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
                >
                  {filtered.map((p, i) => (
                    i === 0 && activeTag === null ? (
                      <FeaturedProjectCard
                        key={p.slug}
                        slug={p.slug}
                        title={p.title}
                        tags={p.tags}
                        description={p.description}
                        image={p.image}
                      />
                    ) : (
                      <ProjectGridCard
                        key={p.slug}
                        slug={p.slug}
                        title={p.title}
                        tags={p.tags}
                        description={p.description}
                        image={p.image}
                      />
                    )
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-works-dark/60 text-lg">
                  Nincs találat a kiválasztott szűrőre.
                </p>
                <button
                  onClick={() => setActiveTag(null)}
                  className="mt-4 text-works-primary font-semibold hover:underline"
                >
                  Összes projekt mutatása
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
