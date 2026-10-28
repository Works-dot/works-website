import type { ConsentPurposes } from "./consent-storage";

/** Remove only our readable first-party Google measurement cookies on denial. */
export function clearDeniedCookies(purposes: ConsentPurposes) {
  if (typeof document === "undefined") return;
  try {
    const domains = window.location.hostname.split(".");
    const suffixes = domains.map((_, index) => domains.slice(index).join("."));
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.trim().split("=")[0];
      const analytics = /^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name);
      const ads = /^_gcl_/.test(name);
      if ((!purposes.analytics && analytics) || (!purposes.advertising && ads)) {
        const expiry = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        document.cookie = expiry;
        for (const domain of suffixes) {
          document.cookie = `${expiry}; domain=${domain}`;
          document.cookie = `${expiry}; domain=.${domain}`;
        }
      }
    }
  } catch { /* Browser restrictions must not prevent a consent withdrawal. */ }
}
