import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { homeOf } from "@/shared/config/appRoutes";
import { accessFor } from "@/shared/config/routeAccess";
import { readRoleHint } from "../edge/jwtClaims";
import { readSessionTokens } from "./sessionCookies";

/**
 * Redirecionamento otimista antes da página renderizar (spec 004, REQ-SHELL-009). Não autoriza nada:
 * só evita piscar conteúdo. A conta é confirmada no layout com `requireRole` (API) e a API decide o acesso.
 *
 * - Rota pública: segue.
 * - Sem nenhum cookie de sessão: login da área, com `next`.
 * - Access com papel de outra área: casa do próprio papel.
 * - Só o refresh (access venceu): segue; o layout manda para o refresh do BFF.
 *
 * @returns o redirecionamento, ou `undefined` para seguir.
 */
export function guardRoute(request: NextRequest): NextResponse | undefined {
  const { pathname, search } = request.nextUrl;
  const access = accessFor(pathname);
  if (access.kind === "public") return undefined;

  const { accessToken, refreshToken } = readSessionTokens(request.cookies);
  if (!accessToken && !refreshToken) {
    const login = new URL(access.loginPath, request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const role = readRoleHint(accessToken);
  if (role && !access.roles.includes(role)) return NextResponse.redirect(new URL(homeOf(role), request.url));
  return undefined;
}
