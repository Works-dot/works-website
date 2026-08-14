import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getLegalDocuments } from "@/lib/strapi";
import type { LegalDocuments } from "@/lib/strapi";
import { fallbackLegalDocuments } from "@/data/fallback";

// A régi /adatkezeles cím megmarad (footerben, régi hivatkozásokban élhet),
// de a tartalom már a hivatalos PDF: automatikusan átirányítunk rá.
export default function Adatkezeles() {
  const { data: legalDocs } = useStrapiQuery<LegalDocuments>(
    "legalDocuments",
    getLegalDocuments,
    fallbackLegalDocuments
  );
  const pdfUrl = legalDocs?.privacyPdfUrl || "";

  useEffect(() => {
    if (pdfUrl && typeof window !== "undefined") {
      window.location.replace(pdfUrl);
    }
  }, [pdfUrl]);

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="pt-28 lg:pt-36 pb-20 lg:pb-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-works-dark mb-6 leading-tight">
              Adatkezelési tájékoztató
            </h1>
            {pdfUrl ? (
              <p className="text-works-dark/60 leading-relaxed">
                Átirányítunk a dokumentumhoz… Ha nem történik meg automatikusan,{" "}
                <a
                  href={pdfUrl}
                  className="text-works-primary font-semibold underline hover:no-underline"
                >
                  kattints ide a megnyitáshoz
                </a>
                .
              </p>
            ) : (
              <p className="text-works-dark/60 leading-relaxed">
                A dokumentum betöltése folyamatban…
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
