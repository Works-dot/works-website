import { useParams } from "wouter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Clock, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getProjectBySlug, getProjects, getNextProject } from "@/lib/strapi";
import type { Project } from "@/lib/strapi";
import { ContentBlock } from "@/components/ContentBlock";
import { fallbackProjects, heroBackgroundFallbackImg } from "@/data/fallback";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { PrimaryAction } from "@/components/ui/button";

export default function CaseStudy() {
  const { locale, t } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const fallbackProject = fallbackProjects.find((p) => p.slug === slug) || null;
  const { data: project, loading, error } = useStrapiQuery<Project | null>(
    `project:${locale}:${slug}`,
    () => getProjectBySlug(slug || "", locale),
    fallbackProject,
    locale
  );
  const { data: projects } = useStrapiQuery<Project[]>("projects", () => getProjects(locale), fallbackProjects, locale);
  const heroBgPattern = heroBackgroundFallbackImg;

  const nextProject = projects && project ? getNextProject(projects, project.slug) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
        <SEOHead />
        <Header />
        <main className="flex-grow pt-28 lg:pt-32 flex items-center justify-center">
          <div className="animate-pulse text-works-dark/30 text-lg">{t("states.loading")}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
        <SEOHead />
        <Header />
        <main className="flex-grow pt-28 lg:pt-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-works-dark mb-4">{t("states.errorHeading")}</h1>
            <p className="text-works-dark/60 mb-6">{t("states.errorBody")}</p>
            <Link href={buildLocalePath(locale, "projects")} className="text-works-primary font-semibold hover:underline">{t("cta.backToProjects")}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
        <SEOHead />
        <Header />
        <main className="flex-grow pt-28 lg:pt-32 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-works-dark mb-4">{t("states.notFoundProject")}</h1>
            <Link href={buildLocalePath(locale, "projects")} className="text-works-primary font-semibold hover:underline">
              {t("cta.backToProjects")}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="relative pt-28 lg:pt-32 pb-16 lg:pb-24 bg-works-dark overflow-hidden">
          {heroBgPattern && (
            <div className="absolute inset-0 opacity-15">
              <img
                src={heroBgPattern}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-works-dark/60 to-works-dark/90" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href={buildLocalePath(locale, "projects")}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white font-semibold mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("cta.backToProjects")}
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm font-semibold text-white border border-white bg-transparent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {project.title}
              </h1>
              <p className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-3xl">
                {project.caseStudy.heroSubtitle}
              </p>
            </motion.div>

            <div className="mt-10 flex flex-wrap gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{t("states.clientLabel", { client: project.caseStudy.client })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{project.caseStudy.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{project.caseStudy.duration}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {project.caseStudy.blocks.map((block, i) => (
                <ContentBlock key={i} block={block} />
              ))}
            </motion.div>
          </div>
        </section>

        {nextProject && (
          <section className="border-t border-works-muted/50 py-16 lg:py-20 bg-works-light">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-works-dark/50 text-sm font-semibold uppercase tracking-widest mb-2 block">
                    {t("cta.nextProject")}
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-bold text-works-dark">
                    {nextProject.title}
                  </h3>
                </div>
                <PrimaryAction asChild className="group">
                  <Link href={buildLocalePath(locale, "projectDetail", nextProject.slug)}>
                    {t("cta.viewProject")}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </PrimaryAction>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
