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
  // The embedded snapshot is locale-scoped. Old flat snapshots are HU-only,
  // which makes EN fail closed rather than displaying Hungarian content.
  const localeFallback = getLocaleFallback<T>(key, locale) ??
    (locale === "hu" ? fallbackData : undefined);
  const [data, setData] = useState<T | null>(() => {
    if (!STRAPI_ENABLED) return localeFallback ?? null;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    return localeFallback ?? null;
  });
  const [loading, setLoading] = useState(STRAPI_ENABLED && data === null);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const fallbackRef = useRef(localeFallback);
  fallbackRef.current = localeFallback;

  useEffect(() => {
    if (!STRAPI_ENABLED) {
      // Strapi is disabled at runtime (production SSG build). The component
      // instance is reused across client-side navigations (e.g. service ->
      // service), so we must sync state to the new key's fallback data here.
      setData(fallbackRef.current ?? null);
      setLoading(false);
      setError(null);
      return;
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
  }, [cacheKey]);

  return { data, loading, error };
}
