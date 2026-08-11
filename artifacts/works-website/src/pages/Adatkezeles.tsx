import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getPrivacyPage } from "@/lib/strapi";
import type { PrivacyPageData } from "@/lib/strapi";
import { fallbackPrivacyPage } from "@/data/fallback";

const markdownClasses = [
  "prose prose-lg max-w-none",
  "text-works-dark/80 leading-relaxed",
  "prose-headings:text-works-dark prose-headings:font-bold",
  "prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg",
  "prose-p:text-works-dark/80 prose-p:leading-relaxed",
  "prose-strong:text-works-dark prose-strong:font-semibold",
  "prose-a:text-works-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
  "prose-ul:text-works-dark/80 prose-ol:text-works-dark/80",
  "prose-li:marker:text-works-primary",
  "prose-blockquote:border-works-primary prose-blockquote:text-works-dark",
].join(" ");

export default function Adatkezeles() {
  const { data: page } = useStrapiQuery<PrivacyPageData>("privacyPage", getPrivacyPage, fallbackPrivacyPage);

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="pt-28 lg:pt-36 pb-20 lg:pb-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-works-dark mb-10 leading-tight">
                {page?.heading || "Adatkezelési tájékoztató"}
              </h1>
              <div className={markdownClasses}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {page?.body || ""}
                </ReactMarkdown>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
