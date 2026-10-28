import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { updateTrackingConsent } from "./gtm-tracking";
import { clearDeniedCookies } from "./consent-cookies";
import { TRACKING_CONSENT_KEY, DENIED_PURPOSES, readConsent, saveConsent, type ConsentPurposes, type ConsentValue } from "./consent-storage";

interface CookieConsentContextValue {
  consent: ConsentValue;
  mapConsent: ConsentValue;
  purposes: ConsentPurposes;
  bannerOpen: boolean;
  detailsOpen: boolean;
  storageError: boolean;
  accept: () => void;
  reject: () => void;
  acceptMap: () => void;
  openSettings: () => void;
  savePreferences: (purposes: ConsentPurposes) => void;
}
const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [decision, setDecision] = useState<ConsentPurposes | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const read = () => {
      try { return readConsent(window.localStorage).purposes; } catch { return null; }
    };
    const stored = read();
    setDecision(stored);
    clearDeniedCookies(stored || DENIED_PURPOSES);
    setBannerOpen(stored === null);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TRACKING_CONSENT_KEY && event.key !== null) return;
      const next = read();
      updateTrackingConsent(next || DENIED_PURPOSES);
      clearDeniedCookies(next || DENIED_PURPOSES);
      setDecision(next);
      setBannerOpen(next === null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const savePreferences = useCallback((next: ConsentPurposes) => {
    let saved = false;
    try { saved = saveConsent(window.localStorage, next); } catch { /* Storage getter may throw. */ }
    const effective = saved ? next : DENIED_PURPOSES;
    updateTrackingConsent(effective);
    clearDeniedCookies(effective);
    setDecision(effective);
    setStorageError(!saved);
    setBannerOpen(!saved);
    if (saved) setDetailsOpen(false);
  }, []);
  const accept = useCallback(() => savePreferences({ analytics: true, advertising: true, map: true }), [savePreferences]);
  const reject = useCallback(() => savePreferences(DENIED_PURPOSES), [savePreferences]);
  const acceptMap = useCallback(() => {
    // Re-read so a map click cannot restore another tab's revoked tracking grant.
    let current = DENIED_PURPOSES;
    try { current = readConsent(window.localStorage).purposes || DENIED_PURPOSES; } catch { /* Deny. */ }
    savePreferences({ ...current, map: true });
  }, [savePreferences]);
  const openSettings = useCallback(() => {
    setDetailsOpen(true);
    setBannerOpen(true);
  }, []);

  return <CookieConsentContext.Provider value={{
    consent: decision ? decision.analytics ? "accepted" : "rejected" : null,
    mapConsent: decision ? decision.map ? "accepted" : "rejected" : null,
    purposes: decision || DENIED_PURPOSES, bannerOpen, detailsOpen, storageError,
    accept, reject, acceptMap, openSettings, savePreferences,
  }}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent csak CookieConsentProvider alatt használható");
  return ctx;
}
