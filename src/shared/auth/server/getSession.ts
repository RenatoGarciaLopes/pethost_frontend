import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { createBackendClient, forwardedForOf } from "@/shared/api/server/backendClient";
import { loginRedirectPath, refreshRedirectPath } from "@/shared/config/appRoutes";
import { sessionUserSchema, type SessionUser } from "../contracts/session";
import { readAccessTokenExpiry, readSessionTokens, type CookieReader } from "./sessionCookies";

export type SessionState =
  | { status: "authenticated"; user: SessionUser }
  | { status: "anonymous" }
  /** O access venceu, mas há refresh: só um Route Handler pode renovar (REQ-HTTP-016). */
  | { status: "refresh-required" };

export interface SessionReaderDeps {
  readCookies: () => Promise<CookieReader>;
  readHeaders: () => Promise<Headers>;
  /** Relógio em ms. */
  now?: () => number;
}

/** Margem para não mandar à API um access que vence no caminho. */
const CLOCK_SKEW_SECONDS = 5;

/**
 * Lê a sessão do servidor perguntando à API (`GET /users/me`); o JWT nunca é a fonte da verdade
 * (REQ-HTTP-015). Server Components não gravam cookie, então access vencido vira `refresh-required`.
 */
export function createSessionReader(deps: SessionReaderDeps) {
  const now = deps.now ?? Date.now;

  return async function readSession(): Promise<SessionState> {
    const { accessToken, refreshToken } = readSessionTokens(await deps.readCookies());
    if (!accessToken && !refreshToken) return { status: "anonymous" };

    const expiry = accessToken ? readAccessTokenExpiry(accessToken) : undefined;
    const usable = accessToken && expiry !== undefined && expiry - now() / 1000 > CLOCK_SKEW_SECONDS;
    if (!usable) return refreshToken ? { status: "refresh-required" } : { status: "anonymous" };

    try {
      const user = await createBackendClient({
        accessToken,
        forwardedFor: forwardedForOf(await deps.readHeaders()),
      }).request({ method: "GET", path: "/users/me" }, sessionUserSchema);
      return { status: "authenticated", user };
    } catch (error) {
      if (hasErrorCode(error, "UNAUTHORIZED")) {
        return refreshToken ? { status: "refresh-required" } : { status: "anonymous" };
      }
      throw error;
    }
  };
}

/** Estado da sessão, memorizado por requisição (`cache` do React). */
export const getSessionState = cache(createSessionReader({ readCookies: cookies, readHeaders: headers }));

/**
 * Conta atual ou `null`. Para página que funciona com ou sem sessão (ex.: `/login`).
 * @example const user = await getSession(); if (user) redirect(homeOf(user.role));
 */
export async function getSession(): Promise<SessionUser | null> {
  const state = await getSessionState();
  return state.status === "authenticated" ? state.user : null;
}

/**
 * Conta atual, ou redireciona: para o refresh (que volta para `currentPath`) ou para o login.
 * @param currentPath caminho da página, usado como `next`.
 */
export async function requireSession(currentPath: string): Promise<SessionUser> {
  const state = await getSessionState();
  if (state.status === "authenticated") return state.user;
  redirect(state.status === "refresh-required" ? refreshRedirectPath(currentPath) : loginRedirectPath(currentPath));
}
