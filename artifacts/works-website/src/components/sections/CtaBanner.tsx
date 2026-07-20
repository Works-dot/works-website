import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getHomepage } from "@/lib/strapi";
import type { HomepageData } from "@/lib/strapi";
import { fallbackHomepage } from "@/data/fallback";

const DEFAULT_HEADING =
  "A designer feladata nem csupán szép felületek tervezése — hanem valódi problémák megoldása.";
const DEFAULT_CTA_TEXT = "Segíthetünk?";
const DEFAULT_CTA_LINK = "/kapcsolat";

export function CtaBanner() {
  const { data: homepage } = useStrapiQuery<HomepageData>("homepage", getHomepage, fallbackHomepage);
  const banner = homepage?.ctaBanner;

  const heading = banner?.heading || DEFAULT_HEADING;
  const ctaText = banner?.ctaText || DEFAULT_CTA_TEXT;
  const ctaLink = banner?.ctaLink || DEFAULT_CTA_LINK;

  const buttonClassName =
    "group inline-flex items-center justify-center px-8 py-4 border border-white text-white font-semibold text-lg hover:bg-white hover:text-works-dark transition-colors duration-300 whitespace-nowrap shrink-0 gap-2";

  const buttonContent = (
    <>
      {ctaText}
      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
    </>
  );

  const isInternal = ctaLink.startsWith("/");

  return (
    <section className="w-full bg-works-dark py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-16"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-2xl">
            {heading}
          </h2>
          {isInternal ? (
            <Link href={ctaLink} className={buttonClassName}>
              {buttonContent}
            </Link>
          ) : (
            <a href={ctaLink} className={buttonClassName}>
              {buttonContent}
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
}
