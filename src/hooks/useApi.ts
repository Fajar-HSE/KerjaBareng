/**
 * Generic fetch hook dengan loading/error/refetch state.
 * Dipakai di semua halaman yang butuh data dari API.
 */
import { useState, useEffect, useCallback } from "react";

export interface ApiState<T> {
  data:     T | null;
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

export function useApi<T>(
  url: string | null,
  options?: RequestInit
): ApiState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url, options)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        return json as T;
      })
      .then((json) => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch((err: Error) => {
        if (!cancelled) { setError(err.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick]);

  return { data, loading, error, refetch };
}
