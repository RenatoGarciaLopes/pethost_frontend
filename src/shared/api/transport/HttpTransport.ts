import type { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Valores aceitos na query; `undefined` e `null` são omitidos, listas repetem a chave. */
export type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean>;

export interface HttpRequest {
  method: HttpMethod;
  /** Caminho relativo à base do transporte (`/users/me`). */
  path: string;
  query?: Record<string, QueryValue>;
  /** Objeto vira JSON; `FormData` segue como multipart. */
  body?: unknown;
  headers?: HeadersInit;
  /** Cancelamento de quem chamou (ex.: TanStack Query). */
  signal?: AbortSignal;
}

/**
 * Porta de saída HTTP (DIP). As features declaram caminho, método e schema;
 * quem implementa decide base, autenticação e cabeçalhos (`backendClient` no servidor, `bffClient` no navegador).
 */
export interface HttpTransport {
  request<TSchema extends z.ZodTypeAny>(request: HttpRequest, schema: TSchema): Promise<z.infer<TSchema>>;
}
