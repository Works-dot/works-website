import { useState, useEffect, useRef } from "react";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const STRAPI_ENABLED = import.meta.env.VITE_STRAPI_ENABLED !== "false";

export function useStrapiQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallbackData?: T
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(() => {
    if (!STRAPI_ENABLED) return fallbackData ?? null;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
    return null;
  });
  const [loading, setLoading] = useState(STRAPI_ENABLED && data === null);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!STRAPI_ENABLED) return;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) {
          cache.set(key, { data: result, timestamp: Date.now() });
          setData(result);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
          if (fallbackData !== undefined) {
            setData(fallbackData);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { data, loading, error };
}
