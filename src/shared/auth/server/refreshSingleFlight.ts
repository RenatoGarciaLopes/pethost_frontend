import "server-only";
import { createHash } from "node:crypto";

export interface SingleFlightOptions {
  /**
   * Por quanto tempo o resultado de sucesso continua valendo para o token antigo.
   * Cobre a requisição que saiu do navegador antes de o `Set-Cookie` novo chegar:
   * sem isso ela gastaria um token já usado e derrubaria a sessão. Padrão 10 s.
   */
  graceMs?: number;
}

const DEFAULT_GRACE_MS = 10_000;

/**
 * Execução única do refresh por token (REQ-HTTP-011). A API gasta o refresh token na primeira chamada
 * (`GETDEL`), então duas renovações simultâneas com o mesmo token derrubariam a sessão.
 *
 * A chave é o SHA-256 do token (o token não fica em memória como chave). Vale para **uma** instância
 * do Next; com várias, ver o limite em `specs/003-http-and-session/requirements.md`.
 *
 * @example const refreshOnce = createRefreshSingleFlight((token) => callApiRefresh(token));
 */
export function createRefreshSingleFlight<TResult, TContext = undefined>(
  refresh: (refreshToken: string, context: TContext) => Promise<TResult>,
  options: SingleFlightOptions = {},
): (refreshToken: string, context: TContext) => Promise<TResult> {
  const graceMs = options.graceMs ?? DEFAULT_GRACE_MS;
  const inFlight = new Map<string, Promise<TResult>>();

  // O contexto (ex.: IP do cliente) é o da primeira chamada; as demais esperam o mesmo resultado.
  return (refreshToken, context) => {
    const key = createHash("sha256").update(refreshToken).digest("hex");
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = refresh(refreshToken, context).then(
      (result) => {
        setTimeout(() => inFlight.delete(key), graceMs).unref?.();
        return result;
      },
      (error: unknown) => {
        inFlight.delete(key);
        throw error;
      },
    );
    inFlight.set(key, promise);
    return promise;
  };
}
