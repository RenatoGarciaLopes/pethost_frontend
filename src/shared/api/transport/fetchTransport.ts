import { ApiError } from "../errors/ApiError";
import type { HttpTransport, QueryValue } from "./HttpTransport";
import { readApiResponse } from "./readApiResponse";

export const DEFAULT_TIMEOUT_MS = 15_000;

export interface FetchTransportOptions {
  /** Base absoluta (`http://api/api/v1`) ou relativa (`/api`). */
  baseUrl: string;
  timeoutMs?: number;
  /** Cabeçalhos de cada chamada (ex.: Bearer do cookie, CSRF). */
  headers?: () => HeadersInit | Promise<HeadersInit>;
  /** Injeção para testes. */
  fetch?: typeof fetch;
  /** Opções extras do `fetch` (ex.: `credentials`, `cache`). */
  init?: Omit<RequestInit, "method" | "body" | "headers" | "signal">;
}

/** Junta base, caminho e query, sem barras duplicadas e sem parâmetros vazios. */
export function buildUrl(baseUrl: string, path: string, query: Record<string, QueryValue> = {}): string {
  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, String(item));
  }
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

/**
 * Transporte HTTP sobre `fetch`: tempo limite, JSON ou multipart e leitura pelo envelope.
 *
 * @example createFetchTransport({ baseUrl: "/api" }).request({ method: "GET", path: "/users/me" }, userSchema)
 */
export function createFetchTransport(options: FetchTransportOptions): HttpTransport {
  // Resolvido a cada chamada: interceptadores (MSW, instrumentação) podem trocar o fetch global depois.
  const fetchFn: typeof fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    async request(request, schema) {
      const headers = new Headers(await options.headers?.());
      new Headers(request.headers).forEach((value, key) => headers.set(key, value));
      headers.set("accept", "application/json");

      let body: BodyInit | undefined;
      if (request.body instanceof FormData) {
        body = request.body;
      } else if (request.body !== undefined) {
        body = JSON.stringify(request.body);
        headers.set("content-type", "application/json");
      }

      const timeout = AbortSignal.timeout(timeoutMs);
      const signal = request.signal ? AbortSignal.any([request.signal, timeout]) : timeout;

      let response: Response;
      try {
        response = await fetchFn(buildUrl(options.baseUrl, request.path, request.query), {
          ...options.init,
          method: request.method,
          headers,
          body,
          signal,
        });
      } catch (error) {
        // Cancelamento de quem chamou segue como está, para o TanStack Query reconhecer.
        if (request.signal?.aborted) throw error;
        throw ApiError.networkError(error);
      }

      return readApiResponse(response, schema);
    },
  };
}
