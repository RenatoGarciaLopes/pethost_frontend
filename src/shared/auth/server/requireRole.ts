import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { homeOf } from "@/shared/config/appRoutes";
import type { AccountRole, SessionUser } from "../contracts/session";
import { currentPath } from "./currentPath";
import { requireSession } from "./getSession";

/**
 * Conta atual com um dos papéis aceitos, confirmada pela API (`GET /users/me`), nunca pelo JWT
 * (spec 004, REQ-SHELL-010). Sem sessão: refresh do BFF ou login (via `requireSession`).
 * Papel de outra área: casa do próprio papel. Espera a requisição (`connection()`) antes de ler a sessão: o
 * prerender não pode tocar o relógio dela (o Next 16 recusa `Date.now()` antes de dados da requisição).
 *
 * @param roles papel ou papéis aceitos
 * @param path caminho da página, usado como `next`; padrão: o caminho atual posto pelo `proxy.ts`
 * @example const user = await requireRole("host");
 */
export async function requireRole(roles: AccountRole | readonly AccountRole[], path?: string): Promise<SessionUser> {
  await connection();
  const user = await requireSession(path ?? (await currentPath()));
  const accepted: readonly AccountRole[] = typeof roles === "string" ? [roles] : roles;
  if (!accepted.includes(user.role)) redirect(homeOf(user.role));
  return user;
}
