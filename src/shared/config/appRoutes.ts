import type { AccountRole } from "@/shared/auth/contracts/session";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";

/** Tela de login (spec 010). */
export const LOGIN_PATH = "/login";
/** Rota do BFF que renova a sessão e volta para `next` (REQ-HTTP-016). */
export const SESSION_REFRESH_PATH = "/api/auth/sessions/refresh";

/** Login com `next` seguro; sem `next` quando o destino é a raiz ou é inseguro. */
export function loginRedirectPath(next: string): string {
  const safe = toSafeInternalPath(next, "/");
  return safe === "/" ? LOGIN_PATH : `${LOGIN_PATH}?next=${encodeURIComponent(safe)}`;
}

/** Renovação da sessão pelo BFF, voltando para `next` (Server Components não gravam cookie). */
export function refreshRedirectPath(next: string): string {
  return `${SESSION_REFRESH_PATH}?next=${encodeURIComponent(toSafeInternalPath(next, "/"))}`;
}

/** Casa de cada papel: destino depois do login e do "voltar" do 404 (REQ-SHELL-016). */
export const ROLE_HOME: Readonly<Record<AccountRole, string>> = {
  owner: "/",
  host: "/host",
  admin: "/admin/host-applications",
};

export function homeOf(role: AccountRole): string {
  return ROLE_HOME[role];
}

/** Para onde ir depois de entrar: o `next` se for interno e seguro, senão a casa do papel. */
export function resolvePostLoginPath(role: AccountRole, next: string | null | undefined): string {
  return toSafeInternalPath(next, homeOf(role));
}
