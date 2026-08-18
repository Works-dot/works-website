import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Központi süti-hozzájárulás kezelés.
// Egyetlen kapcsoló: "accepted" | "rejected" | null (még nincs döntés).
// A döntés localStorage-ben marad meg. Minden sütit használó elem (most a
// Google Térkép, később pl. Google Analytics) ebből az egy állapotból dolgozik.

export type ConsentValue = "accepted" | "rejected" | null;

const STORAGE_KEY = "works-cookie-consent";

interface CookieConsentContextValue {
  /** A látogató döntése. SSR/prerender alatt mindig null. */
  consent: ConsentValue;
  /** Igaz, amíg a sáv látszik (nincs döntés, vagy újra megnyitották). */
  bannerOpen: boolean;
  accept: () => void;
  reject: () => void;
  /** Újra megnyitja a sávot (lábléc „Süti beállítások” link). */
  openSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  // Csak kliensen, hidratálás után olvassuk ki a tárolt döntést,
  // így a prerenderelt HTML és az első kliens-render megegyezik.
  useEffect(() => {
    const stored = readStoredConsent();
    setConsent(stored);
    setBannerOpen(stored === null);
  }, []);

  const persist = useCallback((value: Exclude<ConsentValue, null>) => {
    setConsent(value);
    setBannerOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Privát mód / letiltott tárolás esetén a döntés csak a munkamenetre él.
    }
  }, []);

  const accept = useCallback(() => persist("accepted"), [persist]);
  const reject = useCallback(() => persist("rejected"), [persist]);
  const openSettings = useCallback(() => setBannerOpen(true), []);

  return (
    <CookieConsentContext.Provider
      value={{ consent, bannerOpen, accept, reject, openSettings }}
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
