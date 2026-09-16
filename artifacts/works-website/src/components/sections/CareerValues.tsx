import { TermText } from "@/components/Terminology";
import { useI18n } from "@/i18n";
import type { CareerWhyUsSection } from "@/lib/strapi";

function ValueHeadingText({ title }: { title: string }) {
  const text = title.trimEnd().replace(/[.\s]+$/, "");
  if (!text.trim()) return null;

  return (
    <>
      <TermText>{text}</TermText>
      <span aria-hidden="true" className="text-works-primary">{"\u2060."}</span>
    </>
  );
}

export function CareerValues({ values }: { values?: CareerWhyUsSection }) {
  const { locale } = useI18n();

  return (
    <section className="bg-works-bg" data-testid="career-values" aria-labelledby="career-values-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-12 lg:pb-16">
        <h2 id="career-values-heading" className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight">
          <TermText>{values?.sectionHeading || (locale === "hu" ? "Miért jó nálunk dolgozni?" : "")}</TermText>
        </h2>
      </div>
      <div className="flex flex-col">
        {(values?.items || []).map((item, index) => {
          // index 0: text left, image right -> DOM order Image, Text -> needs flex-row-reverse
          const isReversed = index % 2 === 0;

          return (
            <article
              key={index}
              data-testid="career-value-row"
              className={`relative flex flex-col lg:flex-row ${
                isReversed ? "lg:flex-row-reverse" : ""
              } bg-works-bg shadow-[0_4px_24px_rgba(0,0,0,0.06)] lg:min-h-[31.77vw]`}
              style={{ zIndex: 30 - index }}
            >
              {/* Stacked graphic on mobile; alternating image column on desktop. */}
              <div
                data-testid="career-value-image"
                className={`relative w-full lg:w-1/2 overflow-hidden ${item.image ? "flex aspect-[96/61]" : "hidden"} lg:flex lg:aspect-auto items-center justify-center lg:z-10`}
                aria-hidden="true"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-works-muted/20 hidden lg:block" />
                )}
              </div>

              {/* Text Column */}
              <div
                data-testid="career-value-text"
                className="relative z-10 w-full min-w-0 lg:w-1/2 flex items-center py-8 sm:py-10 lg:py-28"
              >
                <div
                  className={`w-full max-w-[40rem] px-4 sm:px-6 ${
                    isReversed
                      ? "lg:ml-auto lg:mr-0 lg:pl-8 lg:pr-12 xl:pr-16"
                      : "lg:mr-auto lg:ml-0 lg:pr-8 lg:pl-12 xl:pl-16"
                  }`}
                >
                  <h3 className={`text-3xl lg:text-[32px] leading-tight font-bold text-works-dark ${item.description?.trim() ? "mb-4 sm:mb-6" : "mb-0"} lg:mb-6 break-words`}>
                    <ValueHeadingText title={item.title} />
                  </h3>
                  {item.description?.trim() && (
                    <p className="text-lg lg:text-xl text-works-dark/80 leading-relaxed whitespace-pre-line break-words">
                      <TermText>{item.description}</TermText>
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
