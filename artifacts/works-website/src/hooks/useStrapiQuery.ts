import { useState, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n-routes";
import { getLocaleFallback } from "@/data/fallback";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const STRAPI_ENABLED = import.meta.env.VITE_STRAPI_ENABLED !== "false";

export function useStrapiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallbackData?: T,
  locale: Locale = "hu"
): { data: T | null; loading: boolean; error: string | null } {
  const cacheKey = `${locale}:${key}`;
  const isCareer = key === "careerPositions" || key.startsWith("careerPosition:");
  // The embedded snapshot is locale-scoped. Old flat snapshots are HU-only,
  // which makes EN fail closed rather than displaying Hungarian content.
  const localeFallback = getLocaleFallback<T>(key, locale) ??
    (isCareer ? (key === "careerPositions" ? [] as T : undefined) : locale === "hu" ? fallbackData : undefined);
  const [resolvedKey, setResolvedKey] = useState(cacheKey);
  const [data, setData] = useState<T | null>(() => {
    if (!STRAPI_ENABLED) return localeFallback ?? null;
    if (isCareer) return null;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    return localeFallback ?? null;
  });
  // A fallback snapshot is displayable, but not yet the final CMS result.
  const [loading, setLoading] = useState(STRAPI_ENABLED &&
    (isCareer || !cache.get(cacheKey) || Date.now() - cache.get(cacheKey)!.timestamp >= CACHE_TTL));
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const fallbackRef = useRef(localeFallback);
  fallbackRef.current = localeFallback;

  useEffect(() => {
    setResolvedKey(cacheKey);
    if (!STRAPI_ENABLED) {
      // Strapi is disabled at runtime (production SSG build). The component
      // instance is reused across client-side navigations (e.g. service ->
      // service), so we must sync state to the new key's fallback data here.
      setData(fallbackRef.current ?? null);
      setLoading(false);
      setError(null);
      return;
    }

    if (isCareer) {
      // Jobs are availability-sensitive: never reuse a snapshot or TTL cache
      // in live mode. Revalidate on navigation, focus and while left open.
      let cancelled = false;
      let request = 0;
      const refresh = () => {
        const currentRequest = ++request;
        setData(null);
        setLoading(true);
        setError(null);
        Promise.resolve().then(() => fetcherRef.current()).then((result) => {
          if (cancelled || currentRequest !== request) return;
          setData(result);
          setLoading(false);
        }).catch((err) => {
          if (cancelled || currentRequest !== request) return;
          setData(null);
          setError(err instanceof Error ? err.message : "Unable to load career positions");
          setLoading(false);
        });
      };
      refresh();
      const interval = window.setInterval(refresh, 60_000);
      window.addEventListener("focus", refresh);
      return () => {
        cancelled = true;
        window.clearInterval(interval);
        window.removeEventListener("focus", refresh);
      };
    }

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setData(fallbackRef.current ?? null);
    setLoading(true);
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) {
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
          if (fallbackRef.current !== undefined) {
            setData(fallbackRef.current);
          } else {
            setData(null);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, isCareer]);

  if (resolvedKey !== cacheKey) {
    return STRAPI_ENABLED
      ? { data: isCareer ? null : localeFallback ?? null, loading: true, error: null }
      : { data: localeFallback ?? null, loading: false, error: null };
  }
  return { data, loading, error };
}
