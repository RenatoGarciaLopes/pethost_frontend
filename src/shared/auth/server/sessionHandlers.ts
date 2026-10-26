import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { NextResponse as Next } from "next/server";
import { emptyDataSchema } from "@/shared/api/contracts/emptyData";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { createBackendClient, forwardedForOf, type BackendCallContext } from "@/shared/api/server/backendClient";
import { bffErrorResponse, bffSuccessResponse } from "@/shared/api/server/bffResponse";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { getServerEnv } from "@/shared/config/env.server";
import { LOGIN_PATH } from "@/shared/config/appRoutes";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";
import {
  sessionPayloadSchema,
  sessionUserSchema,
  userOfSessionPayload,
  type Session,
  type SessionPayload,
} from "../contracts/session";
import { isAllowedMutation } from "./csrf";
import { getSessionGateway, type AccessResolution, type SessionGateway } from "./sessionGateway";
import { clearSessionCookies, isSecureOrigin, readSessionTokens, setSessionCookies } from "./sessionCookies";
import { applyAccessResolution, csrfRejectedResponse, sessionExpiredResponse } from "./sessionResponses";

export interface SessionHandlerDeps {
  gateway?: SessionGateway;
  backend?: (context: BackendCallContext) => Pick<HttpTransport, "request">;
  allowedOrigins?: readonly string[];
}

interface Resolved {
  gateway: SessionGateway;
  backend: (context: BackendCallContext) => Pick<HttpTransport, "request">;
  allowedOrigins: readonly string[];
}

function resolve(deps: SessionHandlerDeps): Resolved {
  return {
    gateway: deps.gateway ?? getSessionGateway(),
    backend: deps.backend ?? ((context) => createBackendClient(context)),
    allowedOrigins: deps.allowedOrigins ?? getServerEnv().appOrigins,
  };
}

export interface SessionHandlerConfig {
  /** Rota da API relativa ao prefixo (`/auth/sessions/login`). */
  backendPath: string;
  /** Precisa de sessão (troca de conta e de senha). */
  authenticated?: boolean;
  /** Status de sucesso devolvido ao navegador (201 nos cadastros). */
  successStatus?: number;
  /** Revoga o refresh token anterior depois do sucesso (troca de conta, spec 014). */
  revokePreviousRefresh?: boolean;
}

type BackendFactory = (context: BackendCallContext) => Pick<HttpTransport, "request">;

/**
 * Junta tokens e usuário. Quando a rota não devolve o usuário (anfitrião ainda não aprovado
 * em `hosts/reactivate`), lê `GET /users/me` com o access novo.
 */
async function completeSession(
  payload: SessionPayload,
  backend: BackendFactory,
  forwardedFor?: string,
): Promise<Session> {
  const user =
    userOfSessionPayload(payload) ??
    (await backend({ accessToken: payload.accessToken, forwardedFor }).request(
      { method: "GET", path: "/users/me" },
      sessionUserSchema,
    ));
  return { accessToken: payload.accessToken, refreshToken: payload.refreshToken, expiresAt: payload.expiresAt, user };
}

/** Melhor esforço: falha aqui não desfaz a sessão nova; o refresh antigo expira sozinho. */
async function revokeRefreshToken(backend: BackendFactory, refreshToken: string, forwardedFor?: string): Promise<void> {
  await backend({ forwardedFor })
    .request({ method: "POST", path: "/auth/sessions/logout", body: { refreshToken } }, emptyDataSchema)
    .catch(() => undefined);
}

/**
 * Handler `POST` para toda rota da API que devolve uma sessão (REQ-HTTP-007): grava os tokens em cookies
 * HttpOnly e devolve ao navegador **só** `{ user }`.
 *
 * @example export const POST = createSessionHandler({ backendPath: "/auth/sessions/login" });
 */
export function createSessionHandler(config: SessionHandlerConfig, deps: SessionHandlerDeps = {}) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    const { gateway, backend, allowedOrigins } = resolve(deps);
    if (!isAllowedMutation(request, { allowedOrigins })) return csrfRejectedResponse();

    const body: unknown = await request.json().catch(() => null);
    const forwardedFor = forwardedForOf(request.headers);
    const tokens = readSessionTokens(request.cookies);

    let access: AccessResolution = { status: "anonymous" };
    if (config.authenticated) {
      try {
        access = await gateway.resolveAccess(tokens, { forwardedFor });
      } catch (error) {
        // API fora do ar ao renovar não é sessão vencida: 502, cookies intactos.
        return bffErrorResponse(error);
      }
      if (access.status === "anonymous" || access.status === "expired") {
        const response = sessionExpiredResponse();
        applyAccessResolution(response, access, request);
        return response;
      }
    }

    const call = (accessToken?: string): Promise<SessionPayload> =>
      backend({ accessToken, forwardedFor }).request(
        { method: "POST", path: config.backendPath, body },
        sessionPayloadSchema,
      );

    try {
      let payload: SessionPayload;
      try {
        payload = await call("accessToken" in access ? access.accessToken : undefined);
      } catch (error) {
        // Token revogado no meio do caminho: renova uma vez e repete (o corpo JSON pode ser reenviado).
        if (!config.authenticated || !hasErrorCode(error, "UNAUTHORIZED")) throw error;
        access = await gateway.forceRefresh(tokens.refreshToken, { forwardedFor });
        if (access.status !== "renewed") {
          const response = sessionExpiredResponse();
          applyAccessResolution(response, access, request);
          return response;
        }
        payload = await call(access.accessToken);
      }

      const session = await completeSession(payload, backend, forwardedFor);
      if (config.revokePreviousRefresh && tokens.refreshToken && tokens.refreshToken !== session.refreshToken) {
        await revokeRefreshToken(backend, tokens.refreshToken, forwardedFor);
      }

      const response = bffSuccessResponse({ user: session.user }, config.successStatus ?? 200);
      setSessionCookies(response.cookies, session, { secure: isSecureOrigin(request.url) });
      return response;
    } catch (error) {
      const response = bffErrorResponse(error);
      applyAccessResolution(response, access, request);
      return response;
    }
  };
}

/** `POST /api/auth/sessions/logout`: revoga o refresh na API (melhor esforço) e apaga os cookies. */
export function createLogoutHandler(deps: SessionHandlerDeps = {}) {
  return async function POST(request: NextRequest): Promise<NextResponse> {
    const { backend, allowedOrigins } = resolve(deps);
    if (!isAllowedMutation(request, { allowedOrigins })) return csrfRejectedResponse();

    const { refreshToken } = readSessionTokens(request.cookies);
    if (refreshToken) {
      // Mesmo com a API fora do ar, a pessoa sai deste navegador; o refresh expira sozinho.
      await backend({ forwardedFor: forwardedForOf(request.headers) })
        .request({ method: "POST", path: "/auth/sessions/logout", body: { refreshToken } }, emptyDataSchema)
        .catch(() => undefined);
    }

    const response = bffSuccessResponse({});
    clearSessionCookies(response.cookies, { secure: isSecureOrigin(request.url) });
    return response;
  };
}

/**
 * `/api/auth/sessions/refresh`:
 * - `POST` (navegador): renova e devolve `{ user }`, ou 401 `SESSION_EXPIRED` com os cookies apagados.
 * - `GET ?next=` (REQ-HTTP-016): Server Components não gravam cookie, então redirecionam para cá;
 *   renova e volta para `next`, ou vai para o login com `next`.
 */
export function createRefreshHandlers(deps: SessionHandlerDeps = {}) {
  async function POST(request: NextRequest): Promise<NextResponse> {
    const { gateway, allowedOrigins } = resolve(deps);
    if (!isAllowedMutation(request, { allowedOrigins })) return csrfRejectedResponse();

    const { refreshToken } = readSessionTokens(request.cookies);
    try {
      const access = await gateway.forceRefresh(refreshToken, { forwardedFor: forwardedForOf(request.headers) });
      const response =
        access.status === "renewed" ? bffSuccessResponse({ user: access.session.user }) : sessionExpiredResponse();
      applyAccessResolution(response, access, request);
      return response;
    } catch (error) {
      return bffErrorResponse(error);
    }
  }

  async function GET(request: NextRequest): Promise<NextResponse> {
    const { gateway } = resolve(deps);
    const next = toSafeInternalPath(request.nextUrl.searchParams.get("next"), "/");
    const { refreshToken } = readSessionTokens(request.cookies);

    // API fora do ar: vai para o login sem apagar os cookies (a sessão pode continuar válida).
    const access = await gateway
      .forceRefresh(refreshToken, { forwardedFor: forwardedForOf(request.headers) })
      .catch((): AccessResolution => ({ status: "anonymous" }));

    const target = access.status === "renewed" ? new URL(next, request.url) : loginUrl(request.url, next);
    const response = Next.redirect(target, 303);
    applyAccessResolution(response, access, request);
    return response;
  }

  return { GET, POST };
}

function loginUrl(base: string, next: string): URL {
  const url = new URL(LOGIN_PATH, base);
  if (next !== "/") url.searchParams.set("next", next);
  return url;
}
