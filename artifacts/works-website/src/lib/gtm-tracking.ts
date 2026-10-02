/** Initial document navigation is owned by GTM. Only subsequent SPA views are emitted here. */
import { useSyncExternalStore } from "react";
import { readConsent } from "./consent-storage.ts";

type DataLayer = unknown[];

declare global {
  interface Window {
    dataLayer?: DataLayer;
  }
}

export function pushDataLayer(value: unknown) {
  if (typeof window === "undefined") return;
  try {
    (window.dataLayer ||= []).push(value);
  } catch {
    // Blocked measurement must never prevent navigation or consent changes.
  }
}

export function updateTrackingConsent(accepted: boolean) {
  // On a first grant GTM's once-per-document Google tag owns the current URL,
  // even if an SPA route is waiting for its SEO title to commit.
  spaPageViews.consentUpdated(accepted);
  const state = accepted ? "granted" : "denied";
  // GTM's gtag command format is an Arguments object, not an ordinary event.
  function consentCommand(..._args: unknown[]) { pushDataLayer(arguments); }
  consentCommand("consent", "update", {
    analytics_storage: state,
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
  });
  // Container owners can use this event to initialize tags on a subsequent grant.
  pushDataLayer({ event: "works_consent_update", consent_state: state });
}

export function currentPagePath() {
  return window.location.pathname + window.location.search;
}

// Wouter also observes these events, including its patched push/replaceState.
// Subscribe to the *raw* URL separately: Wouter's route/search hooks decodeURI,
// which can collapse distinct encoded URLs into the same hook values.
function subscribeBrowserPath(callback: () => void) {
  for (const event of ["popstate", "pushState", "replaceState", "hashchange"]) {
    window.addEventListener(event, callback);
  }
  return () => {
    for (const event of ["popstate", "pushState", "replaceState", "hashchange"]) {
      window.removeEventListener(event, callback);
    }
  };
}

export function useRawPagePath() {
  return useSyncExternalStore(subscribeBrowserPath, currentPagePath, () => "");
}

function wouterDecode(value: string) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

/** Refuse to acknowledge a new raw URL against an older decoded Wouter render. */
export function matchesRouteSnapshot(raw: string, location: string, search: string, base: string) {
  const separator = raw.indexOf("?");
  const pathname = wouterDecode(separator < 0 ? raw : raw.slice(0, separator));
  const decodedSearch = wouterDecode(separator < 0 ? "" : raw.slice(separator + 1));
  const prefix = wouterDecode(base.replace(/\/+$/, ""));
  const route = pathname.toLowerCase().startsWith(prefix.toLowerCase())
    ? pathname.slice(prefix.length) || "/"
    : `~${pathname}`;
  return route === location && decodedSearch === search;
}

export class SpaPageViews {
  private initialPath: string | null = null;
  private pending: string | null = null;
  private lastSent: string | null = null;
  private trackingGranted: boolean | null = null;
  private initialGoogleViewOwned = false;

  constructor() {
    // Client modules load after the inline consent bootstrap, before any user
    // can change the stored choice. Do not infer first grant from storage later:
    // the accept handler writes storage immediately before calling update.
    this.initializeTracking();
  }

  private initializeTracking() {
    if (this.trackingGranted !== null || typeof window === "undefined") return;
    try {
      const accepted = readConsent(window.localStorage).tracking === "accepted";
      this.trackingGranted = accepted;
      // A persisted grant is already visible to the pre-GTM consent bootstrap:
      // subsequent regrants must not consume pending SPA navigations.
      this.initialGoogleViewOwned = accepted;
    } catch {
      this.trackingGranted = false;
    }
  }

  consentUpdated(granted: boolean) {
    this.initializeTracking();
    this.trackingGranted = granted;
    if (!granted || this.initialGoogleViewOwned || typeof window === "undefined") return;
    // The first post-load grant starts the Google tag and its automatic page_view.
    // Claim the live raw URL (not the last SEO-committed URL) before the grant
    // reaches GTM, so a delayed SEO acknowledgment cannot send it a second time.
    const path = currentPagePath();
    this.initialGoogleViewOwned = true;
    if (this.initialPath === null) this.initialPath = path;
    this.lastSent = path;
    this.pending = null;
  }

  navigate(path: string) {
    this.initializeTracking();
    if (this.initialPath === null) {
      this.initialPath = path;
      this.lastSent = path;
      return;
    }
    if (path !== this.pending) this.pending = path === this.lastSent ? null : path;
  }

  seoCommitted(path: string, title: string) {
    if (this.pending !== path || currentPagePath() !== path || !title) return;
    this.pending = null;
    this.lastSent = path;
    // Do not queue denied page views: a late-loading GTM must not replay them
    // after a first grant and double the Google tag's automatic current view.
    if (this.trackingGranted === false) return;
    pushDataLayer({
      event: "page_view_spa",
      page_path: path,
      page_title: title,
      page_location: window.location.origin + path,
    });
  }
}

export const spaPageViews = new SpaPageViews();