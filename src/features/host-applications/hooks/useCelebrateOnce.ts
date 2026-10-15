"use client";

import { useState, useSyncExternalStore } from "react";

/** Já comemoradas nesta aba, para quando o navegador não deixa usar o storage. */
const celebratedThisSession = new Set<string>();
/** A decisão de cada visita (montagem): tomada uma vez, lida igual em toda renderização. */
const decisions = new WeakMap<object, boolean>();
const storageKey = (id: string) => `pethost.celebrated.${id}`;

function alreadyCelebrated(id: string): boolean {
  if (celebratedThisSession.has(id)) return true;
  try {
    return window.localStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
}

function remember(id: string) {
  celebratedThisSession.add(id);
  try {
    // Só o id da solicitação: não é dado sensível.
    window.localStorage.setItem(storageKey(id), "1");
  } catch {
    // Sem storage (aba privada, bloqueado): fica a memória da aba.
  }
}

function decide(visit: object, id: string | null): boolean {
  const known = decisions.get(visit);
  if (known !== undefined) return known;
  const celebrate = id !== null && !alreadyCelebrated(id);
  if (celebrate) remember(id);
  decisions.set(visit, celebrate);
  return celebrate;
}

const subscribe = () => () => undefined;
const serverSnapshot = () => false;

/**
 * Se esta é a primeira vez que a pessoa vê a aprovação desta solicitação (REQ-HVER-016): `true` uma vez, `false` nas
 * visitas seguintes. Lembra pelo id no `localStorage`; sem storage, uma vez por aba. O servidor nunca comemora; o
 * navegador decide uma vez por montagem, seguro com StrictMode.
 *
 * @example const celebrate = useCelebrateOnce(application.id);
 */
export function useCelebrateOnce(id: string | null): boolean {
  const [visit] = useState(() => ({}));
  return useSyncExternalStore(subscribe, () => decide(visit, id), serverSnapshot);
}
