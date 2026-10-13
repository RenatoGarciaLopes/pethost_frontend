import type { AccountRole, PersonalRole } from "@/shared/auth/contracts/session";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";

/** Tela de login (spec 010). */
export const LOGIN_PATH = "/login";
/** Rota do BFF que renova a sessão e volta para `next` (REQ-HTTP-016). */
const SESSION_REFRESH_PATH = "/api/auth/sessions/refresh";

/** Junta caminho e parâmetros, com `next` seguro e omitido quando é a raiz ou inseguro. */
function withParams(path: string, params: { as?: AccountRole; next?: string | null }): string {
  const search = new URLSearchParams();
  if (params.as) search.set("as", params.as);
  const next = toSafeInternalPath(params.next, "/");
  if (next !== "/") search.set("next", next);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Login com `next` seguro e, opcionalmente, a conta já marcada (`?as=host`, REQ-AUTH-001).
 * @example loginRedirectPath("/pets", "owner") // "/login?as=owner&next=%2Fpets"
 */
export function loginRedirectPath(next: string | null | undefined, as?: PersonalRole): string {
  return withParams(LOGIN_PATH, { as, next });
}

/**
 * Cadastro: sem papel, a escolha entre tutor e anfitrião (`/register`); com papel, o formulário dele.
 * O `next` seguro acompanha para a pessoa voltar aonde estava (REQ-OREG-001).
 * @example registerPath("owner", "/hosts/42") // "/register/owner?next=%2Fhosts%2F42"
 */
export function registerPath(role?: PersonalRole, next?: string | null): string {
  return withParams(role ? `/register/${role}` : "/register", { next });
}

/**
 * Esqueci a senha, com a conta já marcada (`?as=host`; `admin` esconde a escolha, REQ-PWD-001).
 * @example forgotPasswordPath("host") // "/forgot-password?as=host"
 */
export function forgotPasswordPath(as?: AccountRole): string {
  return withParams("/forgot-password", { as });
}

/** Renovação da sessão pelo BFF, voltando para `next` (Server Components não gravam cookie). */
export function refreshRedirectPath(next: string): string {
  return `${SESSION_REFRESH_PATH}?next=${encodeURIComponent(toSafeInternalPath(next, "/"))}`;
}

/** Casa de cada papel: destino depois do login e do "voltar" do 404 (REQ-SHELL-016). */
const ROLE_HOME: Readonly<Record<AccountRole, string>> = {
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
