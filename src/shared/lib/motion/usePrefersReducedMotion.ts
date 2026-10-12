"use client";
import { useMemo, useSyncExternalStore } from "react";

/**
 * Live reduced-motion preference; SSR/unsupported browsers safely disable motion.
 * Use for JS animations; CSS transitions must also use the media query.
 * @example const reducedMotion = usePrefersReducedMotion();
 */
export function usePrefersReducedMotion(): boolean {
  const query = useMemo(
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : undefined,
    [],
  );
  return useSyncExternalStore(
    (notify) => {
      if (!query) return () => {};
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => query?.matches ?? true,
    () => true,
  );
}
