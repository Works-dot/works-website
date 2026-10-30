import { articleAuthor, linkedinProfile } from "@/lib/article-author.js";
import { ManagedImage } from "@/components/ui/ResponsiveImage";
import type { BlogPost } from "@/lib/strapi";
import { useI18n } from "@/i18n";

export function ArticleAuthorCard({ post }: { post: BlogPost }) {
  const { locale } = useI18n();
  const author = articleAuthor(post);
  if (!author) return null;
  const en = locale === "en";
  const linkedin = linkedinProfile(author.linkedinUrl);
  return (
    <aside aria-label={en ? "About the author" : "A szerzőről"}
      className="mt-12 border-t-2 border-works-primary bg-works-light p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {author.image && <ManagedImage sizes="88px" src={author.image} alt={author.imageAlt || author.name}
          loading="lazy" width={88} height={88} className="w-22 h-22 object-cover rounded-full shrink-0" />}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-works-primary mb-2">{en ? "About the author" : "A szerzőről"}</p>
          <h2 className="text-xl font-bold text-works-dark break-words">{author.name}</h2>
          {author.jobTitle && <p className="mt-1 text-sm text-works-dark/70">{author.jobTitle}</p>}
          {author.bio && <p className="mt-4 text-works-dark/80 leading-relaxed whitespace-pre-line">{author.bio}</p>}
          {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer"
            aria-label={`${author.name} – LinkedIn (${en ? "opens in a new tab" : "új lapon nyílik"})`}
            className="inline-block mt-4 font-semibold text-works-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>}
        </div>
      </div>
    </aside>
  );
}
