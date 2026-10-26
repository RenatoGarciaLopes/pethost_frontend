import "server-only";
import type { PersonalRole, SessionUser } from "../contracts/session";
import { requireRole } from "./requireRole";

/** Conta de tutor ou anfitrião, com o papel já estreitado. */
export type PersonalUser = SessionUser & { role: PersonalRole };

/**
 * Páginas das duas contas (`/users/*`) que precisam do papel atual (specs 014 e 015). O `requireRole` espera
 * a requisição (`connection()`) antes de ler a sessão; admin vai para a casa dele (REQ-SWITCH-001,
 * REQ-ACC-001). A sessão vem do `cache()` do `getSession`: o `RoleGate` do layout e a página fazem um só
 * `GET /users/me`.
 *
 * @param path caminho da página, usado como `next` se a sessão tiver acabado
 * @example const user = await requirePersonalUser("/users/password");
 */
export async function requirePersonalUser(path: string): Promise<PersonalUser> {
  const user = await requireRole(["owner", "host"], path);
  return { ...user, role: user.role === "host" ? "host" : "owner" };
}
