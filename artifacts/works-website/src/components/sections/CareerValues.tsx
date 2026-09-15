import { TermText } from "@/components/Terminology";
import { useI18n } from "@/i18n";
import type { CareerWhyUsSection } from "@/lib/strapi";
import { accessibleTermLabel } from "@/lib/terminology";

export function CareerValues({ values }: { values?: CareerWhyUsSection }) {
  const { locale } = useI18n();

  return (
    <section className="py-20 lg:py-28 bg-works-bg" data-testid="career-values" aria-labelledby="career-values-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="career-values-heading" className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight mb-12 lg:mb-16">
          <TermText>{values?.sectionHeading || (locale === "hu" ? "Miért jó nálunk dolgozni?" : "")}</TermText>
        </h2>
        <div className="space-y-12 lg:space-y-20">
          {(values?.items || []).map((item, index) => (
            <article
              key={index}
              data-testid="career-value-row"
              className={`flex flex-col gap-6 lg:gap-12 items-center ${index % 2 ? "lg:flex-row-reverse" : "lg:flex-row"}`}
            >
              <div data-testid="career-value-image" className="w-full min-w-0 lg:flex-1">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={accessibleTermLabel(item.imageAlt || item.title, locale)}
                    loading="lazy"
                    className="block w-full h-auto"
                  />
                ) : (
                  <div aria-hidden="true" className="aspect-[16/10] bg-works-muted/20" />
                )}
              </div>
              <div data-testid="career-value-text" className="w-full min-w-0 lg:flex-1 lg:py-6">
                <h3 className="text-2xl lg:text-[28px] leading-tight font-bold text-works-dark mb-4 break-words">
                  <TermText>{item.title}</TermText>
                </h3>
                {item.description?.trim() && <p className="text-lg lg:text-xl text-works-dark/80 leading-relaxed whitespace-pre-line break-words">
                  <TermText>{item.description}</TermText>
                </p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}