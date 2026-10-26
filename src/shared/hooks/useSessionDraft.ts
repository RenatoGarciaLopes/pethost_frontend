"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { ZodType, ZodTypeDef } from "zod";

function createDraftState<T>(key: string, schema: ZodType<T, ZodTypeDef, unknown>) {
  let draft: T | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const notify = () => listeners.forEach((listener) => listener());
  const remove = () => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* Storage indisponível: estado em memória continua utilizável. */
    }
  };
  return {
    getSnapshot: () => draft,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      try {
        const raw = window.sessionStorage.getItem(key);
        if (raw !== null) {
          const parsed = schema.safeParse(JSON.parse(raw));
          if (parsed.success) draft = parsed.data;
          else {
            draft = null;
            remove();
          }
        }
      } catch {
        draft = null;
        remove();
      }
      notify();
      return () => {
        listeners.delete(listener);
        cancel();
      };
    },
    save: (value: T) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) return;
      cancel();
      draft = parsed.data;
      notify();
      timer = setTimeout(() => {
        try {
          window.sessionStorage.setItem(key, JSON.stringify(parsed.data));
        } catch {
          /* Quota/segurança: não interrompe o formulário. */
        }
        timer = undefined;
      }, 500);
    },
    clear: () => {
      cancel();
      draft = null;
      remove();
      notify();
    },
  };
}
const serverSnapshot = () => null;
/**
 * Rascunho por chave, validado e persistido após 500 ms; SSR não acessa storage.
 * Passe schema estável que exclua arquivos e dados sensíveis. Trocar chave/desmontar cancela escrita pendente.
 * @example const { draft, save, clear } = useSessionDraft(petDraftKey(accountId), petDraftSchema);
 */
export function useSessionDraft<T>(
  key: string,
  schema: ZodType<T, ZodTypeDef, unknown>,
): { draft: T | null; save(value: T): void; clear(): void } {
  const state = useMemo(() => createDraftState(key, schema), [key, schema]);
  const draft = useSyncExternalStore(state.subscribe, state.getSnapshot, serverSnapshot);
  return { draft, save: state.save, clear: state.clear };
}
