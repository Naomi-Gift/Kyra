/**
 * Generic polling hook.
 *
 * Fetches `url` immediately on mount, then re-fetches every `intervalMs`.
 * Cleans up on unmount. Returns the parsed JSON body, a loading flag, and
 * an error string if the last fetch failed.
 */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function usePolling<T>(
  url: string,
  intervalMs = 4000
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNow = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: T = await res.json();
      if (mountedRef.current) {
        setData(json);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Fetch failed");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;

    function schedule() {
      fetchNow().finally(() => {
        if (mountedRef.current) {
          timerRef.current = setTimeout(schedule, intervalMs);
        }
      });
    }

    schedule();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchNow, intervalMs]);

  return { data, loading, error, refresh: fetchNow };
}
