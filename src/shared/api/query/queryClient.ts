import { isServer as runningOnServer, QueryClient } from "@tanstack/react-query";
import { isApiError } from "../errors/ApiError";

const STALE_TIME_MS = 60_000;
const MAX_RETRIES = 2;

/** Repete só o que pode passar sozinho: rede caída e erro 5xx da API. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !isApiError(error)) return false;
  return error.code === "NETWORK_ERROR" || error.status >= 500;
}

/** QueryClient com os padrões do app. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/**
 * Servidor: instância nova por chamada (nunca compartilha cache entre pessoas).
 * Navegador: uma instância estável, para o cache sobreviver a re-renderizações (REQ-HTTP-018).
 */
export function getQueryClient({ isServer = runningOnServer }: { isServer?: boolean } = {}): QueryClient {
  if (isServer) return createQueryClient();
  browserClient ??= createQueryClient();
  return browserClient;
}

/**
 * Chave de query com a conta na frente. A mesma pessoa pode ter conta de tutor e de anfitrião;
 * com a conta na chave, trocar de conta nunca mostra dado da outra (REQ-HTTP-018).
 *
 * @example useQuery({ queryKey: accountQueryKey(user.id, "pets"), ... })
 */
export function accountQueryKey(accountId: string, ...parts: unknown[]): readonly unknown[] {
  return ["account", accountId, ...parts];
}
