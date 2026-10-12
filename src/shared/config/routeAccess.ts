import type { AccountRole } from "@/shared/auth/contracts/session";
import { LOGIN_PATH } from "./appRoutes";

const ADMIN_LOGIN_PATH = "/admin/login";

export type RouteAccess = { kind: "public" } | { kind: "protected"; roles: readonly AccountRole[]; loginPath: string };

interface Rule {
  prefix: string;
  roles: readonly AccountRole[];
  loginPath: string;
}

const PUBLIC_PATHS = [ADMIN_LOGIN_PATH];

/** Áreas protegidas por prefixo (spec 004). A primeira regra que casar vale. */
const RULES: readonly Rule[] = [
  { prefix: "/admin", roles: ["admin"], loginPath: ADMIN_LOGIN_PATH },
  { prefix: "/host", roles: ["host"], loginPath: LOGIN_PATH },
  { prefix: "/owner", roles: ["owner"], loginPath: LOGIN_PATH },
  { prefix: "/pets", roles: ["owner", "host"], loginPath: LOGIN_PATH },
  { prefix: "/users", roles: ["owner", "host"], loginPath: LOGIN_PATH },
  { prefix: "/conversations", roles: ["owner", "host"], loginPath: LOGIN_PATH },
];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/**
 * Quem pode abrir `pathname` (REQ-SHELL-009). Função pura usada pelo proxy e pelos testes.
 * Tudo que não está numa área protegida é público (home, busca, cantinho, login, cadastro, senha).
 */
export function accessFor(pathname: string): RouteAccess {
  if (PUBLIC_PATHS.some((path) => matches(pathname, path))) return { kind: "public" };
  const rule = RULES.find(({ prefix }) => matches(pathname, prefix));
  return rule ? { kind: "protected", roles: rule.roles, loginPath: rule.loginPath } : { kind: "public" };
}
