import { Link } from "wouter";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { ArrowLinkLabel } from "@/components/ui/arrow-link-label";

interface ProjectCardProps {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
  imageAlt?: string;
  reverse?: boolean;
  /** Disable the scroll-into-view entry animation (needed inside horizontal carousels, where the peeking card would stay invisible). */
  animated?: boolean;
  /** Clamp the description to 3 lines with an ellipsis (mobile carousel). */
  clampDescription?: boolean;
}

export function ProjectCard({ slug, title, tags, description, image, imageAlt, reverse = false, animated = true, clampDescription = false }: ProjectCardProps) {
  const { locale, t } = useI18n();
  return (
    <motion.div
      {...(animated
        ? {
            initial: { opacity: 0, y: 30 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-100px" },
            transition: { duration: 0.7 },
          }
        : {})}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
    >
      <div className="w-full lg:w-1/2 overflow-hidden">
        <div className="w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center">
          <img
            src={image}
            alt={imageAlt || title}
            className="relative z-10 w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-start py-4">
        <h3 className="text-3xl lg:text-4xl font-bold text-works-dark mb-4 leading-tight">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm font-semibold text-neutral-600 border border-neutral-400 bg-transparent"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className={`text-lg text-works-dark/60 mb-8 leading-relaxed${clampDescription ? " line-clamp-3" : ""}`}>
          {description}
        </p>
        <Link
          href={buildLocalePath(locale, "projectDetail", slug)}
          className="group"
        >
          <ArrowLinkLabel size="large">
            {t("cta.viewCaseStudy")}
          </ArrowLinkLabel>
        </Link>
      </div>
    </motion.div>
  );
}
