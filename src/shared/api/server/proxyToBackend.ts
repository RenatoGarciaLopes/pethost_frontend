import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedMutation } from "@/shared/auth/server/csrf";
import { readSessionTokens } from "@/shared/auth/server/sessionCookies";
import { getSessionGateway, type AccessResolution, type SessionGateway } from "@/shared/auth/server/sessionGateway";
import {
  applyAccessResolution,
  csrfRejectedResponse,
  sessionExpiredResponse,
} from "@/shared/auth/server/sessionResponses";
import { getServerEnv, type ServerEnv } from "@/shared/config/env.server";
import { ApiError } from "../errors/ApiError";
import { forwardedForOf } from "./backendClient";
import { bffErrorResponse, bffLocalError } from "./bffResponse";
import { matchBffRoute } from "./bffRoutes";

/** Prefixo das rotas do BFF no Next. */
export const BFF_PREFIX = "/api";

/** Cabeçalhos do navegador que seguem para a API (o resto, inclusive `cookie`, fica no BFF). */
const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "content-length"];
/** Cabeçalhos da API que voltam ao navegador (REQ-HTTP-010). */
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-length", "retry-after", "location", "content-disposition"];

export interface ProxyDeps {
  env?: ServerEnv;
  gateway?: SessionGateway;
  fetch?: typeof fetch;
}

/**
 * Proxy do BFF (`app/api/[...path]`): lista permitida → CSRF → sessão (renova antes de vencer) →
 * repasse com Bearer e `X-Forwarded-For` → um refresh e uma repetição se a API responder 401.
 * Corpo em streaming nos dois sentidos (multipart não é carregado na memória, REQ-HTTP-014).
 */
export function createBffProxy(deps: ProxyDeps = {}) {
  return async function handle(request: NextRequest): Promise<NextResponse> {
    const env = deps.env ?? getServerEnv();
    const gateway = deps.gateway ?? getSessionGateway();
    const fetchFn = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init));

    const path = request.nextUrl.pathname.slice(BFF_PREFIX.length);
    if (!matchBffRoute(request.method, path)) {
      return bffLocalError(404, "ROUTE_NOT_ALLOWED", "Route not allowed");
    }
    if (!isAllowedMutation(request, { allowedOrigins: env.appOrigins })) {
      return csrfRejectedResponse();
    }

    const tokens = readSessionTokens(request.cookies);
    const forwardedFor = forwardedForOf(request.headers);
    let access: AccessResolution;
    try {
      access = await gateway.resolveAccess(tokens, { forwardedFor });
    } catch (error) {
      return bffErrorResponse(error);
    }
    if (access.status === "expired") return applyAccessResolution(sessionExpiredResponse(), access, request);

    // Corpo JSON é pequeno: fica em memória para poder repetir depois de um refresh.
    // Multipart segue em streaming e, por isso, não é repetido.
    const replayable = !request.body || isJson(request);
    const body = !request.body ? undefined : replayable ? await request.arrayBuffer() : request.body;

    const send = (accessToken?: string) =>
      fetchFn(`${env.backendApiBaseUrl}${path}${request.nextUrl.search}`, {
        method: request.method,
        headers: upstreamHeaders(request.headers, accessToken, forwardedFor),
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(env.requestTimeoutMs),
        // Necessário para enviar ReadableStream no fetch do Node.
        ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
      } as RequestInit);

    try {
      let upstream = await send(accessTokenOf(access));

      if (upstream.status === 401 && replayable && access.status !== "renewed" && tokens.refreshToken) {
        access = await gateway.forceRefresh(tokens.refreshToken, { forwardedFor });
        if (access.status !== "renewed") return applyAccessResolution(sessionExpiredResponse(), access, request);
        upstream = await send(access.accessToken);
      }

      return applyAccessResolution(toBrowserResponse(upstream), access, request);
    } catch (error) {
      return applyAccessResolution(bffErrorResponse(ApiError.networkError(error)), access, request);
    }
  };
}

function accessTokenOf(access: AccessResolution): string | undefined {
  return access.status === "valid" || access.status === "renewed" ? access.accessToken : undefined;
}

function isJson(request: Request): boolean {
  return (request.headers.get("content-type") ?? "").toLowerCase().includes("json");
}

function upstreamHeaders(incoming: Headers, accessToken: string | undefined, forwardedFor: string | undefined) {
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = incoming.get(name);
    if (value !== null) headers.set(name, value);
  }
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  return headers;
}

function toBrowserResponse(upstream: Response): NextResponse {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  headers.set("cache-control", "no-store");
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
