import { Link } from "wouter";
import { BlogCard } from "@/components/ui/BlogCard";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getBlogPosts, getHomepage } from "@/lib/strapi";
import type { BlogPost, HomepageData } from "@/lib/strapi";
import { fallbackBlogPosts, fallbackHomepage } from "@/data/fallback";

export function BlogPreview() {
  const { data: blogPosts, loading } = useStrapiQuery<BlogPost[]>("blogPosts", getBlogPosts, fallbackBlogPosts);
  const { data: homepage } = useStrapiQuery<HomepageData>("homepage", getHomepage, fallbackHomepage);

  const previewPosts = (blogPosts || []).slice(0, 3);

  return (
    <section id="blog" className="py-24 lg:py-32 bg-works-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-works-muted/50 pb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight">
              {homepage?.blogSection?.heading || "Legfrissebb írásaink"}
            </h2>
          </div>
          <Link href="/blog" className="group text-works-dark font-semibold hover:text-works-primary transition-colors inline-flex items-center w-fit">
            Minden bejegyzés megtekintése
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-works-muted/30 aspect-[4/3] mb-4" />
                <div className="h-4 bg-works-muted/30 w-1/3 mb-3" />
                <div className="h-6 bg-works-muted/30 w-2/3 mb-2" />
                <div className="h-4 bg-works-muted/30 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {previewPosts.map((post, i) => (
              <BlogCard 
                key={post.slug}
                slug={post.slug}
                index={i}
                title={post.title}
                excerpt={post.excerpt}
                date={post.date}
                image={post.image}
              />
            ))}
          </div>
        )}
        
      </div>
    </section>
  );
}
