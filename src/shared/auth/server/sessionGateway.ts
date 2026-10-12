import "server-only";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createBackendClient, type BackendCallContext } from "@/shared/api/server/backendClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { sessionSchema, type Session } from "../contracts/session";
import { createRefreshSingleFlight } from "./refreshSingleFlight";
import { readAccessTokenExpiry } from "./sessionCookies";

/** Renova quando faltar menos que isto para o access vencer (REQ-HTTP-011). */
export const REFRESH_THRESHOLD_SECONDS = 60;

/** Resultado de conferir os tokens de uma requisição. */
export type AccessResolution =
  | { status: "anonymous" }
  | { status: "valid"; accessToken: string }
  | { status: "renewed"; accessToken: string; session: Session }
  | { status: "expired" };

export interface SessionTokensInput {
  accessToken?: string;
  refreshToken?: string;
}

type ClientContext = Pick<BackendCallContext, "forwardedFor">;

export interface SessionGatewayDeps {
  backend?: (context: BackendCallContext) => Pick<HttpTransport, "request">;
  /** Relógio em ms. */
  now?: () => number;
}

/**
 * Regras de sessão do BFF num lugar só: quando renovar, como renovar (uma vez por token) e
 * o que fazer quando a API recusa o refresh. Proxy, handlers de sessão e `getSession` usam o mesmo gateway.
 */
export function createSessionGateway(deps: SessionGatewayDeps = {}) {
  const backend = deps.backend ?? ((context: BackendCallContext) => createBackendClient(context));
  const now = deps.now ?? Date.now;

  const refreshOnce = createRefreshSingleFlight((refreshToken: string, context: ClientContext) =>
    backend({ forwardedFor: context.forwardedFor }).request(
      { method: "POST", path: "/auth/sessions/refresh", body: { refreshToken } },
      sessionSchema,
    ),
  );

  async function forceRefresh(refreshToken: string | undefined, context: ClientContext): Promise<AccessResolution> {
    if (!refreshToken) return { status: "expired" };
    try {
      const session = await refreshOnce(refreshToken, context);
      return { status: "renewed", accessToken: session.accessToken, session };
    } catch (error) {
      // Refresh recusado: sessão acabou. Outros erros (API fora do ar) não derrubam a sessão.
      if (isApiError(error) && (error.status === 401 || error.status === 400)) return { status: "expired" };
      throw error;
    }
  }

  async function resolveAccess(tokens: SessionTokensInput, context: ClientContext): Promise<AccessResolution> {
    const { accessToken, refreshToken } = tokens;
    if (!accessToken && !refreshToken) return { status: "anonymous" };
    if (accessToken && (!refreshToken || hasRoom(accessToken))) return { status: "valid", accessToken };
    return forceRefresh(refreshToken, context);
  }

  function hasRoom(accessToken: string): boolean {
    const expiry = readAccessTokenExpiry(accessToken);
    return expiry !== undefined && expiry - now() / 1000 > REFRESH_THRESHOLD_SECONDS;
  }

  return { resolveAccess, forceRefresh };
}

export type SessionGateway = ReturnType<typeof createSessionGateway>;

let defaultGateway: SessionGateway | undefined;

/** Gateway do processo (o single-flight precisa ser o mesmo para todas as requisições). */
export function getSessionGateway(): SessionGateway {
  defaultGateway ??= createSessionGateway();
  return defaultGateway;
}
