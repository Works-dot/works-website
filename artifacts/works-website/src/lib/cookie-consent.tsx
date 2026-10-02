import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { updateTrackingConsent } from "./gtm-tracking";
import {
  MAP_CONSENT_KEY,
  TRACKING_CONSENT_KEY,
  readConsent,
  saveConsent,
  type ConsentValue,
} from "./consent-storage";

interface CookieConsentContextValue {
  /** Versioned analytics + advertising decision; legacy map choices cannot grant this. */
  consent: ConsentValue;
  /** Independent Google Maps embed decision. */
  mapConsent: ConsentValue;
  /** Igaz, amíg a sáv látszik (nincs döntés, vagy újra megnyitották). */
  bannerOpen: boolean;
  storageError: boolean;
  accept: () => void;
  reject: () => void;
  acceptMap: () => void;
  /** Újra megnyitja a sávot (lábléc „Süti beállítások” link). */
  openSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [mapConsent, setMapConsent] = useState<ConsentValue>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);

  // Csak kliensen, hidratálás után olvassuk ki a tárolt döntést,
  // így a prerenderelt HTML és az első kliens-render megegyezik.
  useEffect(() => {
    const stored = readConsent(window.localStorage);
    setConsent(stored.tracking);
    setMapConsent(stored.map);
    // An old map acceptance is not a decision about measurement.
    setBannerOpen(stored.tracking === null && stored.map !== "rejected");
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TRACKING_CONSENT_KEY && event.key !== MAP_CONSENT_KEY && event.key !== null) return;
      const next = readConsent(window.localStorage);
      // A Maps-only change in another tab must not emit tracking updates.
      if (event.key !== MAP_CONSENT_KEY) updateTrackingConsent(next.tracking === "accepted");
      setConsent(next.tracking);
      setMapConsent(next.map);
      setBannerOpen(next.tracking === null && next.map !== "rejected");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const accept = useCallback(() => {
    // Both grants must be stored before any tracking update or map embed.
    const mapSaved = saveConsent(window.localStorage, MAP_CONSENT_KEY, "accepted");
    const trackingSaved = mapSaved && saveConsent(window.localStorage, TRACKING_CONSENT_KEY, "accepted");
    if (!trackingSaved || !mapSaved) {
      // Undo a partial grant. No tracking update can be granted on write failure.
      saveConsent(window.localStorage, TRACKING_CONSENT_KEY, "rejected");
      saveConsent(window.localStorage, MAP_CONSENT_KEY, "rejected");
      updateTrackingConsent(false);
      setConsent("rejected");
      setMapConsent("rejected");
      setStorageError(true);
      setBannerOpen(true);
      return;
    }
    setStorageError(false);
    updateTrackingConsent(true);
    setConsent("accepted");
    setMapConsent("accepted");
    setBannerOpen(false);
  }, []);

  const reject = useCallback(() => {
    const trackingSaved = saveConsent(window.localStorage, TRACKING_CONSENT_KEY, "rejected");
    const mapSaved = saveConsent(window.localStorage, MAP_CONSENT_KEY, "rejected");
    updateTrackingConsent(false);
    setConsent("rejected");
    setMapConsent("rejected");
    setStorageError(!trackingSaved || !mapSaved);
    setBannerOpen(!trackingSaved || !mapSaved);
  }, []);
  const acceptMap = useCallback(() => {
    if (saveConsent(window.localStorage, MAP_CONSENT_KEY, "accepted")) {
      setMapConsent("accepted");
      setStorageError(false);
    } else {
      setStorageError(true);
    }
  }, []);
  const openSettings = useCallback(() => setBannerOpen(true), []);

  return (
    <CookieConsentContext.Provider
      value={{ consent, mapConsent, bannerOpen, storageError, accept, reject, acceptMap, openSettings }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent csak CookieConsentProvider alatt használható");
  }
  return ctx;
}
