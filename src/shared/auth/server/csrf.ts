import { CSRF_HEADER } from "../contracts/csrf";

export { CSRF_HEADER };

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface CsrfOptions {
  /** Origens públicas do app (ex.: `https://pethost.app` quando o Next roda atrás de um proxy). */
  allowedOrigins?: readonly string[];
}

/**
 * Defesa de CSRF do BFF (REQ-HTTP-013): mutação só com `Origin` do próprio app
 * e `X-PetHost-Request: 1`. Leituras passam.
 */
export function isAllowedMutation(request: Request, options: CsrfOptions = {}): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const origin = request.headers.get("origin");
  if (!origin || request.headers.get(CSRF_HEADER) !== "1") return false;

  const allowed = new Set([new URL(request.url).origin, ...(options.allowedOrigins ?? [])]);
  return allowed.has(origin);
}
