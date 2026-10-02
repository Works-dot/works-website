import { readConsent } from "./consent-storage.ts";
import { pushDataLayer } from "./gtm-tracking.ts";

/** An async submission only counts if tracking was granted both at submit and at success. */
export function emitContactFormSuccess(grantedAtSubmit: boolean, grantedAtSuccess: boolean) {
  if (!grantedAtSubmit || !grantedAtSuccess || typeof window === "undefined") return;
  try {
    // Re-read persisted consent: another tab can revoke while the request is in flight.
    if (readConsent(window.localStorage).tracking !== "accepted") return;
    // Do not send form contents, email, subject, CV URL, or any user-entered values.
    pushDataLayer({ event: "contact_form_success" });
  } catch {
    // Blocked storage/tracking must not affect the successful form response.
  }
}