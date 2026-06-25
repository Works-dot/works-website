import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentBlock as ContentBlockType } from "@/lib/strapi";

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

export function ContentBlock({ block }: { block: ContentBlockType }) {
  if (block.type === "text") {
    return (
      <div className={markdownClasses}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
      </div>
    );
  }

  if (block.type === "highlight") {
    return (
      <blockquote className="border-l-4 border-works-primary bg-works-light px-8 py-6 my-10">
        <p className="text-xl font-semibold text-works-dark leading-relaxed">
          {block.content}
        </p>
      </blockquote>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="my-10">
        <div className="overflow-hidden bg-works-light">
          <img
            src={block.content}
            alt={block.caption || ""}
            className="w-full h-auto object-cover"
          />
        </div>
        {block.caption && (
          <figcaption className="mt-3 text-sm text-works-dark/50 text-center">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
}
