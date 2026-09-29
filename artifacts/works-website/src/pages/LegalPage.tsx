import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getLegalDocuments, type LegalDocuments } from "@/lib/strapi";
import { fallbackLegalDocuments } from "@/data/fallback";
import { useCookieConsent } from "@/lib/cookie-consent";
import { PrimaryAction } from "@/components/ui/button";

export default function LegalPage({ kind }: { kind: "privacy" | "cookie" | "imprint" }) {
  const { openSettings } = useCookieConsent();
  const { data } = useStrapiQuery<LegalDocuments>(
    "legalDocuments", () => getLegalDocuments("hu"), fallbackLegalDocuments, "hu",
  );
  const title = data?.[`${kind}Title`];
  const body = data?.[`${kind}Body`];
  const pdf = data?.[`${kind}PdfUrl`];
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead />
      <Header />
      <main lang="hu" className="flex-grow pt-28 lg:pt-36 pb-20 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-works-dark mb-8">{title || "Jogi tájékoztató"}</h1>
          {body ? (
            <div className="prose max-w-none break-words prose-headings:text-works-dark prose-a:text-works-primary [&_table]:block [&_table]:overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
                h1: ({ children }) => <h2>{children}</h2>,
              }}>{body}</ReactMarkdown>
            </div>
          ) : (
            <p role="alert">A közzétett jogi szöveg jelenleg nem érhető el. Kérjük, próbálja újra később.</p>
          )}
          {pdf && <p className="mt-8"><a href={pdf} className="underline text-works-primary" target="_blank" rel="noopener noreferrer">Letölthető PDF (magyar)</a></p>}
          {kind === "cookie" && <PrimaryAction type="button" className="mt-8" onClick={openSettings} data-testid="button-open-cookie-settings">Sütibeállítások</PrimaryAction>}
        </article>
      </main>
      <Footer />
    </div>
  );
}