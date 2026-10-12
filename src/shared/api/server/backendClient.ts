import "server-only";
import { getServerEnv, type ServerEnv } from "@/shared/config/env.server";
import type { HttpTransport } from "../transport/HttpTransport";
import { createFetchTransport } from "../transport/fetchTransport";

export interface BackendCallContext {
  /** Access token do cookie; sem ele a chamada vai anônima. */
  accessToken?: string;
  /** Cadeia `X-Forwarded-For` do cliente (ver `forwardedForOf`). */
  forwardedFor?: string;
}

export interface BackendClientDeps {
  env?: ServerEnv;
  fetch?: typeof fetch;
}

/**
 * Transporte do servidor para a API .NET: base e tempo limite do ambiente,
 * `Authorization: Bearer` e `X-Forwarded-For` (o limite de requisições da API é por IP).
 * Server Components, Route Handlers e o proxy usam este cliente; o navegador usa `bffClient`.
 */
export function createBackendClient(context: BackendCallContext = {}, deps: BackendClientDeps = {}): HttpTransport {
  const env = deps.env ?? getServerEnv();
  return createFetchTransport({
    baseUrl: env.backendApiBaseUrl,
    timeoutMs: env.requestTimeoutMs,
    fetch: deps.fetch,
    init: { cache: "no-store" },
    headers: () => {
      const headers = new Headers();
      if (context.accessToken) headers.set("authorization", `Bearer ${context.accessToken}`);
      if (context.forwardedFor) headers.set("x-forwarded-for", context.forwardedFor);
      return headers;
    },
  });
}

/**
 * IP do cliente para o `X-Forwarded-For`: a cadeia que o proxy da frente montou, ou o `X-Real-IP`.
 * A API só confia no último salto (loopback ou rede privada), então valor forjado à esquerda não vale.
 */
export function forwardedForOf(headers: Headers): string | undefined {
  return headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? undefined;
}
