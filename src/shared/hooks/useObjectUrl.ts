"use client";
import { useMemo, useSyncExternalStore } from "react";
function createObjectUrlState(file: File | null) {
  let url: string | null = null;
  return {
    getSnapshot: () => url,
    subscribe: (notify: () => void) => {
      if (file) {
        url = URL.createObjectURL(file);
        notify();
      }
      return () => {
        if (url) URL.revokeObjectURL(url);
        url = null;
      };
    },
  };
}
const serverSnapshot = () => null;
/**
 * Prévia em memória, criada após montagem e revogada ao trocar arquivo ou desmontar.
 * SSR retorna null. Preserve a identidade de File entre renders.
 * @example const preview = useObjectUrl(selectedFile);
 */
export function useObjectUrl(file: File | null): string | null {
  const state = useMemo(() => createObjectUrlState(file), [file]);
  return useSyncExternalStore(state.subscribe, state.getSnapshot, serverSnapshot);
}
