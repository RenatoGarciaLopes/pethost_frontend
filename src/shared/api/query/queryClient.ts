import { isServer as runningOnServer, QueryClient } from "@tanstack/react-query";
import { isApiError } from "../errors/ApiError";

const STALE_TIME_MS = 60_000;
const MAX_RETRIES = 2;

/**
 * Prefixo de consultas por usuário; nunca use senha ou token em parts (REQ-SWITCH-003/010).
 * @example accountQueryKey(user.id, "linked-accounts") // ["account", user.id, "linked-accounts"]
 */
export function accountQueryKey(userId: string, ...parts: readonly unknown[]) {
  return ["account", userId, ...parts] as const;
}

/** Prefixo privado da trilha, opcionalmente limitado ao alvo; permite invalidar sem importar features.
 * @example adminAuditQueryKey(adminId, { targetType: "owner", targetId: ownerId })
 */
export function adminAuditQueryKey(userId: string, target?: { targetType: string; targetId: string }) {
  const prefix = accountQueryKey(userId, "admin", "audit");
  return target ? ([...prefix, target] as const) : prefix;
}

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
