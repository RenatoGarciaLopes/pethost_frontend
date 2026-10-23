import type { AccountRole, PersonalRole } from "@/shared/auth/contracts/session";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";

/** Tela de login (spec 010). */
export const LOGIN_PATH = "/login";
/** Rota do BFF que renova a sessão e volta para `next` (REQ-HTTP-016). */
const SESSION_REFRESH_PATH = "/api/auth/sessions/refresh";

/** Avisos que o login sabe mostrar. A URL leva só a chave; o texto vem da lista fixa do login. */
const LOGIN_NOTICES = ["conta-pausada"] as const;
export type LoginNotice = (typeof LOGIN_NOTICES)[number];

/** Junta caminho e parâmetros, com `next` seguro e omitido quando é a raiz ou inseguro. */
function withParams(
  path: string,
  params: { as?: AccountRole; to?: PersonalRole; next?: string | null; aviso?: LoginNotice },
): string {
  const search = new URLSearchParams();
  if (params.as) search.set("as", params.as);
  if (params.to) search.set("to", params.to);
  if (params.aviso) search.set("aviso", params.aviso);
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
 * Login com um aviso da lista fixa (REQ-ACC-024: conta pausada). Nunca leva texto livre na URL.
 * @example loginNoticePath("conta-pausada", "host") // "/login?as=host&aviso=conta-pausada"
 */
export function loginNoticePath(aviso: LoginNotice, as?: PersonalRole): string {
  return withParams(LOGIN_PATH, { as, aviso });
}

/**
 * Valor de `?aviso=` que o login reconhece; qualquer outro é ignorado.
 * @example isLoginNotice("conta-pausada") // true
 */
export function isLoginNotice(value: string | undefined): value is LoginNotice {
  return LOGIN_NOTICES.some((notice) => notice === value);
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
 * Troca de conta (spec 014) já apontando a conta de destino; o `next` seguro é para onde a pessoa volta depois
 * (REQ-SWITCH-013).
 * @example switchAccountPath("owner", "/listings/42") // "/users/switch?to=owner&next=%2Flistings%2F42"
 */
export function switchAccountPath(to: PersonalRole, next?: string | null): string {
  return withParams("/users/switch", { to, next });
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
