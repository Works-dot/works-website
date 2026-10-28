import { readConsent } from "./consent-storage.ts";
import { pushDataLayer } from "./gtm-tracking.ts";

export function hasAnalyticsConsent(): boolean {
  try {
    return typeof window !== "undefined" &&
      readConsent(window.localStorage).purposes?.analytics === true;
  } catch { return false; }
}

export function emitInteraction(event: "newsletter_signup" | "email_click" | "phone_click", grantedAtStart = true) {
  if (grantedAtStart && hasAnalyticsConsent()) pushDataLayer({ event });
}

export function contactLinkEvent(href: string | null): "email_click" | "phone_click" | null {
  if (/^mailto:/i.test(href?.trim() || "")) return "email_click";
  if (/^tel:/i.test(href?.trim() || "")) return "phone_click";
  return null;
}

/** Delegation covers CMS links, nested icons, keyboard activation and SPA routes. */
export function trackContactLinkClick(event: MouseEvent) {
  if (event.button !== 0 || event.defaultPrevented) return;
  const element = event.target instanceof Element ? event.target : null;
  const link = element?.closest("a[href]");
  const name = contactLinkEvent(link?.getAttribute("href") || null);
  if (name) emitInteraction(name);
}
