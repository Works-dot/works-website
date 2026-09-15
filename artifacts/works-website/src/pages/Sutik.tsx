import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import SEOHead from "@/components/SEOHead";
import { useCookieConsent } from "@/lib/cookie-consent";
import { PrimaryAction } from "@/components/ui/button";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getLegalDocuments } from "@/lib/strapi";
import type { LegalDocuments } from "@/lib/strapi";
import { fallbackLegalDocuments } from "@/data/fallback";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { TermText } from "@/components/Terminology";

// A régi /sutik cím megmarad a sütisáv és más hivatkozások számára, de ha a
// hivatalos PDF elérhető, automatikusan arra irányítunk. A korábbi rövid
// tájékoztató használható tartalékként megmarad, ha az adminban nincs PDF.
export default function Sutik() {
  const { openSettings } = useCookieConsent();
  const { locale, t } = useI18n();
  const { data: legalDocs } = useStrapiQuery<LegalDocuments>(
    "legalDocuments",
    () => getLegalDocuments(locale),
    fallbackLegalDocuments,
    locale
  );
  const pdfUrl = legalDocs?.cookiePdfUrl || "";

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
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-works-dark mb-8 leading-tight">
              <TermText>{t("cookiePage.pageHeading")}</TermText>
            </h1>

            <div className="space-y-6 text-works-dark/70 leading-relaxed">
              <p><TermText>{t("cookiePage.introBody")}</TermText></p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                <TermText>{t("cookiePage.sectionEssential")}</TermText>
              </h2>
              <p>
                <TermText>{t("cookiePage.essentialBodyBeforeStorageKey")}</TermText>{" "}
                <code>works-cookie-consent</code>{" "}
                <TermText>{t("cookiePage.essentialBodyAfterStorageKey")}</TermText>
              </p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                <TermText>{t("cookiePage.sectionThirdParty")}</TermText>
              </h2>
              <p>
                <TermText>{t("cookiePage.thirdPartyBody")}</TermText>{" "}
                <TermText>{t("cookiePage.thirdPartyPolicyLeadIn")}</TermText>{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-works-primary font-semibold underline hover:no-underline"
                >
                  <TermText>{t("cookiePage.googlePolicyLinkLabel")}</TermText>
                </a>
                .
              </p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                <TermText>{t("cookiePage.sectionFonts")}</TermText>
              </h2>
              <p><TermText>{t("cookiePage.fontsBody")}</TermText></p>

              <h2 className="text-xl font-bold text-works-dark pt-4">
                <TermText>{t("cookiePage.sectionModify")}</TermText>
              </h2>
              <p><TermText>{t("cookiePage.modifyBody")}</TermText></p>
              <PrimaryAction
                type="button"
                onClick={openSettings}
                className="text-sm"
                data-testid="button-open-cookie-settings"
              >
                <TermText>{t("cookiePage.openSettingsButton")}</TermText>
              </PrimaryAction>

              <p className="pt-4">
                <TermText>{t("cookiePage.privacyBodyLeadIn")}</TermText>{" "}
                <a
                  href={buildLocalePath(locale, "privacy")}
                  className="text-works-primary font-semibold underline hover:no-underline"
                >
                  <TermText>{t("cookiePage.privacyPageLinkLabel")}</TermText>
                </a>
                <TermText>{t("cookiePage.privacyBodyTrailingText")}</TermText>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
