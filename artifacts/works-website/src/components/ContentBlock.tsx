import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentBlock as ContentBlockType } from "@/lib/strapi";
import { useI18n } from "@/i18n";
import {
  accessibleTermLabel,
  terminologyRemarkPlugin,
} from "@/lib/terminology";
import { TermText } from "@/components/Terminology";

const markdownClasses = [
  "prose prose-lg max-w-none mb-8",
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

const highlightMarkdownClasses = [
  "prose prose-lg max-w-none",
  "text-xl font-semibold text-works-dark leading-relaxed",
  "prose-p:text-xl prose-p:font-semibold prose-p:text-works-dark prose-p:leading-relaxed",
  "prose-p:my-0 first:prose-p:mt-0 last:prose-p:mb-0",
  "prose-strong:text-works-dark prose-strong:font-bold",
  "prose-a:text-works-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline",
].join(" ");

/** Egységes markdown-megjelenítő — egy helyen konfigurálva. */
export function Markdown({ className, children }: { className: string; children: string }) {
  const { locale } = useI18n();

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, terminologyRemarkPlugin(locale)]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function ContentBlock({ block }: { block: ContentBlockType }) {
  const { locale } = useI18n();

  if (block.type === "text") {
    return <Markdown className={markdownClasses}>{block.content}</Markdown>;
  }

  if (block.type === "highlight") {
    return (
      <blockquote className="border-l-4 border-works-primary bg-works-light px-8 py-6 my-10">
        <Markdown className={highlightMarkdownClasses}>{block.content}</Markdown>
      </blockquote>
    );
  }

  if (block.type === "image") {
    const imageAlt = block.alt !== undefined ? block.alt : block.caption || "";

    return (
      <figure className="my-10">
        <div className="overflow-hidden bg-works-light">
          <img
            src={block.content}
            alt={accessibleTermLabel(imageAlt, locale)}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-3 text-sm text-works-dark/50 text-center">
            <TermText locale={locale}>{block.caption}</TermText>
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
}
