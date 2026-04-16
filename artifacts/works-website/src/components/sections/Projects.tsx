import { Link } from "wouter";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getProjects, getHomepage } from "@/lib/strapi";
import type { Project, HomepageData } from "@/lib/strapi";
import { fallbackProjects, fallbackHomepage, bgGraphic2FallbackImg } from "@/data/fallback";

export function Projects() {
  const { data: projects, loading } = useStrapiQuery<Project[]>("projects", getProjects, fallbackProjects);
  const { data: homepage } = useStrapiQuery<HomepageData>("homepage", getHomepage, fallbackHomepage);

  const featuredProjects = (projects || []).slice(0, 3);
  const bgGraphic2 = bgGraphic2FallbackImg;

  return (
    <section id="projects" className="py-24 lg:py-32 bg-works-bg relative overflow-hidden">
      {bgGraphic2 && (
        <img
          src={bgGraphic2}
          alt=""
          aria-hidden="true"
          className="absolute -bottom-32 -right-40 w-[500px] md:w-[650px] lg:w-[800px] opacity-25 pointer-events-none select-none z-0"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-works-muted/50 pb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight">
              {homepage?.projectsSection?.heading || "Kiemelt projektjeink"}
            </h2>
          </div>
          <Link href="/projektek" className="group text-works-dark font-semibold hover:text-works-primary transition-colors inline-flex items-center w-fit">
            Minden projekt megtekintése
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-24 lg:gap-32">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
                <div className="w-full lg:w-1/2 bg-works-muted/30 aspect-[4/3]" />
                <div className="w-full lg:w-1/2 space-y-4">
                  <div className="h-4 bg-works-muted/30 w-1/3" />
                  <div className="h-8 bg-works-muted/30 w-2/3" />
                  <div className="h-4 bg-works-muted/30 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-24 lg:gap-32">
            {featuredProjects.map((p, i) => (
              <ProjectCard 
                key={p.slug}
                slug={p.slug}
                title={p.title}
                tags={p.tags}
                description={p.description}
                image={p.homepageImage || p.image}
                reverse={i % 2 !== 0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
