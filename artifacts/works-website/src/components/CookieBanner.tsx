import { Link } from "wouter";
import { useCookieConsent } from "@/lib/cookie-consent";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";

// Süti hozzájárulási sáv — a GDPR/ePrivacy minimumnak megfelelően az
// elutasítás ugyanolyan hangsúlyos és egyszerű, mint az elfogadás.
// Csak kliensoldalon, hidratálás után jelenik meg (bannerOpen az
// effectben áll be), így a prerenderelt HTML-t nem érinti.
export function CookieBanner() {
  const { bannerOpen, accept, reject } = useCookieConsent();
  const { locale, t } = useI18n();

  if (!bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookieBanner.dialogLabel")}
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 bg-works-dark text-white shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm leading-relaxed text-works-light/90 md:flex-1">
          {t("cookieBanner.text")}{" "}
          <Link
            href={buildLocalePath(locale, "cookies")}
            className="underline text-white hover:text-works-primary transition-colors"
          >
            {t("cookieBanner.cookiePolicyLinkLabel")}
          </Link>
          .
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={reject}
            className="px-5 py-2.5 text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
            data-testid="button-cookie-reject"
          >
            {t("cookieBanner.reject")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-5 py-2.5 text-sm font-semibold bg-works-primary text-white hover:bg-works-primary/90 transition-colors"
            data-testid="button-cookie-accept"
          >
            {t("cookieBanner.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
