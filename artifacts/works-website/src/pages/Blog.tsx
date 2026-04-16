import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResponsiveFilter } from "@/components/ui/ResponsiveFilter";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getBlogPosts } from "@/lib/strapi";
import type { BlogPost } from "@/lib/strapi";
import { fallbackBlogPosts } from "@/data/fallback";

function FeaturedBlogCard({ slug, title, excerpt, date, image, author, readingTime }: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author: string;
  readingTime: string;
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
      <Link href={`/blog/${slug}`} className="group flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
        <div className="w-full lg:w-1/2 overflow-hidden bg-works-light aspect-[4/3]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-start py-2">
          <div className="flex items-center gap-4 text-sm text-works-dark/50 mb-4 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-works-primary" />
              {date}
            </span>
            <span>{readingTime}</span>
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-works-dark mb-3 leading-tight group-hover:text-works-primary transition-colors">
            {title}
          </h3>
          <p className="text-base lg:text-lg text-works-dark/60 leading-relaxed mb-4">
            {excerpt}
          </p>
          <p className="text-sm text-works-dark/50 mb-6">{author}</p>
          <span className="inline-flex items-center gap-2 text-works-primary font-semibold text-sm">
            Elolvasom
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function BlogGridCard({ slug, title, excerpt, date, image, author, readingTime, index }: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  author: string;
  readingTime: string;
  index: number;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="col-span-1"
    >
      <Link href={`/blog/${slug}`} className="group flex flex-col bg-white overflow-hidden border border-works-muted/30 hover:border-works-primary/30 hover:shadow-lg transition-all duration-300">
        <div className="w-full aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-6 sm:p-8 flex flex-col flex-grow">
          <div className="flex items-center gap-4 text-sm text-works-dark/50 mb-4 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-works-primary" />
              {date}
            </span>
            <span>{readingTime}</span>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-works-dark mb-2 leading-tight group-hover:text-works-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {title}
          </h3>
          <p className="text-sm text-works-dark/60 leading-relaxed mb-4 line-clamp-3 min-h-[4.5rem]">
            {excerpt}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm text-works-dark/50">{author}</span>
            <span className="inline-flex items-center gap-1 text-works-primary font-semibold text-sm">
              Elolvasom
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Blog() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { data: blogPosts, loading, error } = useStrapiQuery<BlogPost[]>("blogPosts", getBlogPosts, fallbackBlogPosts);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const allItems = blogPosts || [];

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
                Szakmai tartalom
              </h1>
              <p className="text-lg lg:text-xl text-works-dark/60 max-w-2xl">
                UX trendek, design gondolkodás és gyakorlati tanácsok digitális termékekhez.
              </p>
            </div>

            {!loading && usedTags.length > 0 && (
              <div className="mb-12">
                <ResponsiveFilter
                  options={usedTags}
                  value={activeTag}
                  onChange={setActiveTag}
                  allLabel="Összes cikk"
                />
              </div>
            )}

            {error ? (
              <div className="text-center py-16">
                <p className="text-xl font-semibold text-works-dark mb-2">Hiba történt</p>
                <p className="text-works-dark/60">A cikkek betöltése sikertelen. Kérjük, próbáld újra később.</p>
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
                  {filtered.map((post, i) => (
                    i === 0 && activeTag === null ? (
                      <FeaturedBlogCard
                        key={post.slug}
                        slug={post.slug}
                        title={post.title}
                        excerpt={post.excerpt}
                        date={post.date}
                        image={post.image}
                        author={post.author}
                        readingTime={post.readingTime}
                      />
                    ) : (
                      <BlogGridCard
                        key={post.slug}
                        slug={post.slug}
                        title={post.title}
                        excerpt={post.excerpt}
                        date={post.date}
                        image={post.image}
                        author={post.author}
                        readingTime={post.readingTime}
                        index={i}
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
                  Összes cikk mutatása
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
