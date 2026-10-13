"use client";

import { useState, useSyncExternalStore } from "react";
import { readSecretFromUrl, withoutSecret } from "../lib/url/readSecretFromUrl";

function createSecretState(name: string) {
  let value: string | null | undefined;
  return {
    getSnapshot: () => value,
    subscribe: (notify: () => void) => {
      if (value === undefined) {
        value = readSecretFromUrl(name, window.location);
        const clean = withoutSecret(name, window.location);
        const current = window.location.pathname + window.location.search + window.location.hash;
        if (clean !== current) window.history.replaceState(window.history.state, "", clean);
        notify();
      }
      return () => {};
    },
  };
}

const getServerSnapshot = () => undefined;

/**
 * Captura o segredo uma vez após montar e o retira da URL sem navegar. Estado só em memória,
 * por instância; `name` identifica o segredo durante toda a montagem. SSR retorna `undefined`.
 * @example const token = useUrlSecret("token");
 */
export function useUrlSecret(name: string): string | null | undefined {
  const [state] = useState(() => createSecretState(name));
  return useSyncExternalStore(state.subscribe, state.getSnapshot, getServerSnapshot);
}
