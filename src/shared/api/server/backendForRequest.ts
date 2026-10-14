import "server-only";
import { cookies, headers } from "next/headers";
import type { HttpTransport } from "../transport/HttpTransport";
import { readSessionTokens } from "@/shared/auth/server/sessionCookies";
import { createBackendClient, forwardedForOf } from "./backendClient";

/**
 * Cliente da API para a requisição atual (Server Components e prefetch): access do cookie HttpOnly e o IP
 * de quem pediu. Não renova sessão nem autoriza: chame depois de `requireRole`.
 *
 * @example const backend = await backendForRequest(); await backend.request({ method: "GET", path: "/pets/me" }, schema);
 */
export async function backendForRequest(): Promise<HttpTransport> {
  const { accessToken } = readSessionTokens(await cookies());
  return createBackendClient({ accessToken, forwardedFor: forwardedForOf(await headers()) });
}
