import { useCallback, useEffect, useRef } from "react";

/**
 * Coalesce high-frequency calls (e.g. native color picker drag) to one
 * invocation per animation frame with the latest value.
 */
export function useRafThrottledCallback<T>(
  callback: (value: T) => void,
): (value: T) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const pendingRef = useRef<T | undefined>(undefined);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return useCallback((value: T) => {
    pendingRef.current = value;
    if (rafRef.current != null) {
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const next = pendingRef.current;
      if (next !== undefined) {
        callbackRef.current(next);
      }
    });
  }, []);
}
