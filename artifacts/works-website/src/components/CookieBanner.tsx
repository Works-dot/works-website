import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useCookieConsent } from "@/lib/cookie-consent";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { PrimaryAction } from "@/components/ui/button";
import { TermText } from "@/components/Terminology";
import { accessibleTermLabel } from "@/lib/terminology";

// Süti hozzájárulási sáv — a GDPR/ePrivacy minimumnak megfelelően az
// elutasítás ugyanolyan hangsúlyos és egyszerű, mint az elfogadás.
// Csak kliensoldalon, hidratálás után jelenik meg (bannerOpen az
// effectben áll be), így a prerenderelt HTML-t nem érinti.
export function CookieBanner() {
  const { bannerOpen, detailsOpen, purposes, storageError, accept, reject, openSettings, savePreferences } = useCookieConsent();
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState(purposes);
  const firstSwitch = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (bannerOpen) setDraft(purposes);
  }, [bannerOpen, purposes]);
  useEffect(() => {
    if (bannerOpen && detailsOpen) firstSwitch.current?.focus();
  }, [bannerOpen, detailsOpen]);

  if (!bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-label={accessibleTermLabel(t("cookieBanner.dialogLabel"), locale)}
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 max-h-[85dvh] overflow-y-auto bg-works-dark text-white shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="text-sm leading-relaxed text-works-light/90 md:flex-1">
          <p>
            <TermText>{t("cookieBanner.text")}</TermText>{" "}
            <Link
              href={buildLocalePath(locale, "cookies")}
              className="underline text-white hover:text-works-primary transition-colors"
            >
              <TermText>{t("cookieBanner.cookiePolicyLinkLabel")}</TermText>{locale === "en" ? " (Hungarian)" : ""}
            </Link>
            .
          </p>
          {detailsOpen && <fieldset id="cookie-purpose-settings" className="mt-4 space-y-3">
            <legend className="font-semibold mb-2">{t("cookieBanner.details")}</legend>
            {(["analytics", "advertising", "map"] as const).map((purpose, index) => (
              <label key={purpose} className="flex items-center gap-3 cursor-pointer py-1">
                <input
                  ref={index === 0 ? firstSwitch : undefined}
                  type="checkbox"
                  role="switch"
                  checked={draft[purpose]}
                  onChange={(event) => setDraft({ ...draft, [purpose]: event.target.checked })}
                  className="h-5 w-5 accent-works-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  data-testid={`cookie-${purpose}`}
                />
                <span>{t(`cookieBanner.${purpose}`)}</span>
              </label>
            ))}
          </fieldset>}
          {storageError && <p role="alert" className="mt-2 text-red-200"><TermText>{t("cookieBanner.storageError")}</TermText></p>}
        </div>
        <div className="flex flex-wrap gap-3 md:max-w-xs flex-shrink-0">
          <button type="button" onClick={openSettings} aria-expanded={detailsOpen}
            aria-controls="cookie-purpose-settings" className="text-sm underline px-2 py-2.5"
            data-testid="button-cookie-details">
            {t("cookieBanner.details")}
          </button>
          <button
            type="button"
            onClick={reject}
            className="px-5 py-2.5 text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
            data-testid="button-cookie-reject"
          >
            <TermText>{t("cookieBanner.reject")}</TermText>
          </button>
          <PrimaryAction
            type="button"
            onClick={accept}
            size="compact"
            className="text-sm"
            data-testid="button-cookie-accept"
          >
            <TermText>{t("cookieBanner.accept")}</TermText>
          </PrimaryAction>
          {detailsOpen && <button type="button" onClick={() => savePreferences(draft)}
            className="px-5 py-2.5 text-sm font-semibold border border-white text-white hover:bg-white/10"
            data-testid="button-cookie-save">{t("cookieBanner.save")}</button>}
        </div>
      </div>
    </div>
  );
}
