// The original key was only a Google Maps decision. Never use it as evidence
// of analytics or advertising consent, even if its value is "accepted".
export const MAP_CONSENT_KEY = "works-cookie-consent";
export const TRACKING_CONSENT_KEY = "works-tracking-consent-v2";

export type ConsentValue = "accepted" | "rejected" | null;

export function readConsent(storage: Storage): { tracking: ConsentValue; map: ConsentValue } {
  try {
    const tracking = storage.getItem(TRACKING_CONSENT_KEY);
    const map = storage.getItem(MAP_CONSENT_KEY);
    return {
      tracking: tracking === "accepted" || tracking === "rejected" ? tracking : null,
      map: map === "accepted" || map === "rejected" ? map : null,
    };
  } catch {
    // Including blocked localStorage: both purposes fail closed.
    return { tracking: null, map: null };
  }
}

export function saveConsent(storage: Storage, key: string, value: "accepted" | "rejected"): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    if (value === "rejected") {
      // A failed overwrite must not leave an older "accepted" grant behind.
      try {
        storage.removeItem(key);
        return true;
      } catch {
        // Browser policy can forbid both writes and removals.
      }
    }
    return false;
  }
}