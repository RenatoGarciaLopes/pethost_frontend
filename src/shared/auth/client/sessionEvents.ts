type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Assina o aviso de sessão vencida (o BFF respondeu `SESSION_EXPIRED`).
 * O `QueryProvider` assina para limpar o cache e ir ao login (REQ-HTTP-012).
 * @returns função que cancela a assinatura.
 */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Dispara o aviso; chamado pelo `bffClient`. */
export function notifySessionExpired(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (error) {
      console.error("[session] ouvinte de sessão vencida falhou", error);
    }
  }
}
