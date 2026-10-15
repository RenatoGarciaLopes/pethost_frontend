"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";

/** Objeto por aviso: a identidade marca qual aviso já foi lido. */
interface Flash {
  message: string;
}

interface FlashStore {
  show: (message: string) => void;
  peek: () => Flash | null;
  consume: (flash: Flash) => void;
}

function createFlashStore(): FlashStore {
  let pending: Flash | null = null;
  return {
    show: (message) => {
      pending = { message };
    },
    peek: () => pending,
    consume: (flash) => {
      if (pending === flash) pending = null;
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

/**
 * Lê e consome o aviso gravado pela tela anterior: devolve a frase nesta montagem e `null` nas seguintes. Seguro
 * com StrictMode: a leitura acontece no render (as duas renderizações veem a mesma frase) e o consumo, num efeito
 * idempotente. Mostre o resultado num `Notice` discreto (`role="status"`).
 *
 * @throws {Error} fora do `FlashMessageProvider`
 * @example
 * const message = useFlashMessageOnce();
 * return message ? <Notice tone="ok" title={message} /> : null;
 */
export function useFlashMessageOnce(): string | null {
  const store = useFlashStore("useFlashMessageOnce");
  const [flash] = useState(store.peek);
  useEffect(() => {
    if (flash) store.consume(flash);
  }, [store, flash]);
  return flash?.message ?? null;
}
