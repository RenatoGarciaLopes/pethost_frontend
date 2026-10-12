import "server-only";
import type { NextResponse } from "next/server";
import { bffLocalError } from "@/shared/api/server/bffResponse";
import type { AccessResolution } from "./sessionGateway";
import { clearSessionCookies, isSecureOrigin, setSessionCookies } from "./sessionCookies";

/** 401 `SESSION_EXPIRED`: o navegador limpa o cache e vai para o login (REQ-HTTP-012). */
export const sessionExpiredResponse = () => bffLocalError(401, "SESSION_EXPIRED", "Session expired");

/** 403 `CSRF_REJECTED` (REQ-HTTP-013). */
export const csrfRejectedResponse = () => bffLocalError(403, "CSRF_REJECTED", "Cross-site request rejected");

/** Aplica no `response` o efeito de uma conferência de sessão: regrava cookies renovados ou apaga os vencidos. */
export function applyAccessResolution(
  response: NextResponse,
  resolution: AccessResolution,
  request: Request,
): NextResponse {
  const secure = isSecureOrigin(request.url);
  if (resolution.status === "renewed") setSessionCookies(response.cookies, resolution.session, { secure });
  if (resolution.status === "expired") clearSessionCookies(response.cookies, { secure });
  return response;
}
