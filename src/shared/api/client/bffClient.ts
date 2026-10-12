import { CSRF_HEADER } from "@/shared/auth/contracts/csrf";
import { notifySessionExpired } from "@/shared/auth/client/sessionEvents";
import { hasErrorCode } from "../errors/ApiError";
import type { HttpTransport } from "../transport/HttpTransport";
import { createFetchTransport } from "../transport/fetchTransport";

export interface BffClientOptions {
  /** Padrão `/api` (mesma origem). */
  baseUrl?: string;
  onSessionExpired?: () => void;
  fetch?: typeof fetch;
}

/**
 * Transporte do navegador para o BFF (`/api/*`): mesma origem, cookies HttpOnly enviados pelo navegador,
 * cabeçalho anti-CSRF e aviso de sessão vencida. Nenhuma feature chama `fetch` direto.
 *
 * @example bffClient.request({ method: "GET", path: "/pets/me" }, petsSchema)
 */
export function createBffClient(options: BffClientOptions = {}): HttpTransport {
  const transport = createFetchTransport({
    baseUrl: options.baseUrl ?? "/api",
    fetch: options.fetch,
    init: { credentials: "same-origin" },
    headers: () => ({ [CSRF_HEADER]: "1" }),
  });
  const onSessionExpired = options.onSessionExpired ?? notifySessionExpired;

  return {
    async request(request, schema) {
      try {
        return await transport.request(request, schema);
      } catch (error) {
        if (hasErrorCode(error, "SESSION_EXPIRED")) onSessionExpired();
        throw error;
      }
    },
  };
}

/** Instância do app. */
export const bffClient = createBffClient();
