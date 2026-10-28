export const MAP_CONSENT_KEY = "works-cookie-consent"; // Legacy: never read as permission.
export const TRACKING_CONSENT_KEY = "works-tracking-consent-v2";
export type ConsentValue = "accepted" | "rejected" | null;
export interface ConsentPurposes {
  analytics: boolean;
  advertising: boolean;
  map: boolean;
}
export const DENIED_PURPOSES: ConsentPurposes = { analytics: false, advertising: false, map: false };

export function readConsent(storage: Storage) {
  let purposes: ConsentPurposes | null = null;
  try {
    const value = JSON.parse(storage.getItem(TRACKING_CONSENT_KEY) || "null");
    if (value?.version === 3 &&
        typeof value.analytics === "boolean" &&
        typeof value.advertising === "boolean" &&
        typeof value.map === "boolean") {
      purposes = { analytics: value.analytics, advertising: value.advertising, map: value.map };
    }
  } catch { /* Missing, legacy, malformed and inaccessible storage all deny. */ }
  return {
    purposes,
    tracking: (purposes ? purposes.analytics ? "accepted" : "rejected" : null) as ConsentValue,
    map: (purposes ? purposes.map ? "accepted" : "rejected" : null) as ConsentValue,
  };
}

export function saveConsent(storage: Storage, purposes: ConsentPurposes): boolean {
  try {
    storage.setItem(TRACKING_CONSENT_KEY, JSON.stringify({ version: 3, ...purposes }));
    return true;
  } catch {
    // Never leave an earlier grant behind when an overwrite fails.
    try { storage.removeItem(TRACKING_CONSENT_KEY); } catch { /* Report failure below. */ }
    return false;
  }
}
