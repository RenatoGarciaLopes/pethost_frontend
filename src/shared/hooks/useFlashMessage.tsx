"use client";

import { createContext, use, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

/** Objeto por aviso: a identidade marca qual aviso já foi lido. */
interface Flash {
  message: string;
}

interface FlashStore {
  show: (message: string) => void;
  peek: () => Flash | null;
  subscribe: (listener: () => void) => () => void;
  /** Alguém está mostrando o aviso: não some. */
  hold: (flash: Flash) => void;
  /** Quem mostrava saiu: o aviso some, a menos que alguém o mostre de novo logo em seguida. */
  release: (flash: Flash) => void;
}

function createFlashStore(): FlashStore {
  let pending: Flash | null = null;
  let releaseTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    show: (message) => {
      clearTimeout(releaseTimer);
      pending = { message };
      notify();
    },
    peek: () => pending,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hold: (flash) => {
      if (pending === flash) clearTimeout(releaseTimer);
    },
    release: (flash) => {
      // Remontagem imediata (StrictMode, o Next trocando a página do cache pela resposta nova) cancela o consumo.
      releaseTimer = setTimeout(() => {
        if (pending !== flash) return;
        pending = null;
        notify();
      }, 0);
    },
  };
}

const FlashContext = createContext<FlashStore | null>(null);

/**
 * Guarda em memória o aviso que atravessa uma navegação no cliente (spec 022, REQ-PEDIT-012). Fica no
 * `AppProviders`, acima das rotas, para sobreviver ao `router.push`. Nunca vai para URL, localStorage nem
 * sessionStorage: recarregar a página perde o aviso, de propósito.
 *
 * @example <FlashMessageProvider>{children}</FlashMessageProvider>
 */
export function FlashMessageProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createFlashStore);
  return <FlashContext value={store}>{children}</FlashContext>;
}

function useFlashStore(hook: string): FlashStore {
  const store = use(FlashContext);
  if (!store) throw new Error(`${hook} precisa do FlashMessageProvider`);
  return store;
}

/**
 * Grava um aviso para a próxima tela mostrar uma vez (`useFlashMessageOnce`). Use antes de navegar, depois de
 * uma ação que tira a pessoa da tela atual. Não use para aviso da própria tela: aí é `Notice` ou `useAnnounce`.
 * Um aviso novo substitui o anterior ainda não lido.
 *
 * @throws {Error} fora do `FlashMessageProvider`
 * @example
 * const flash = useFlashMessage();
 * flash.show("A ficha de Thor saiu da lista.");
 * router.push("/pets");
 */
export function useFlashMessage(): Pick<FlashStore, "show"> {
  const { show } = useFlashStore("useFlashMessage");
  return { show };
}

const serverSnapshot = () => null;

/**
 * Mostra o aviso gravado pela tela anterior e o consome quando a tela que o mostra sai: a frase fica enquanto quem a
 * mostra estiver montado e some na visita seguinte. Uma remontagem logo em seguida (StrictMode, ou o Next restaurando a
 * página da visita anterior e trocando pela resposta nova do servidor) não perde nem repete o aviso. Mostre o resultado
 * num `Notice` discreto (`role="status"`).
 *
 * @throws {Error} fora do `FlashMessageProvider`
 * @example
 * const message = useFlashMessageOnce();
 * return message ? <Notice tone="ok" title={message} /> : null;
 */
export function useFlashMessageOnce(): string | null {
  const store = useFlashStore("useFlashMessageOnce");
  const flash = useSyncExternalStore(store.subscribe, store.peek, serverSnapshot);
  useEffect(() => {
    if (!flash) return;
    store.hold(flash);
    return () => store.release(flash);
  }, [store, flash]);
  return flash?.message ?? null;
}
