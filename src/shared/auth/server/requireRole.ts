import "server-only";
import { redirect } from "next/navigation";
import { homeOf } from "@/shared/config/appRoutes";
import type { AccountRole, SessionUser } from "../contracts/session";
import { currentPath } from "./currentPath";
import { requireSession } from "./getSession";

/**
 * Conta atual com um dos papéis aceitos, confirmada pela API (`GET /users/me`), nunca pelo JWT
 * (spec 004, REQ-SHELL-010). Sem sessão: refresh do BFF ou login (via `requireSession`).
 * Papel de outra área: casa do próprio papel.
 *
 * @param roles papel ou papéis aceitos
 * @param path caminho da página, usado como `next`; padrão: o caminho atual posto pelo `proxy.ts`
 * @example const user = await requireRole("host");
 */
export async function requireRole(roles: AccountRole | readonly AccountRole[], path?: string): Promise<SessionUser> {
  const user = await requireSession(path ?? (await currentPath()));
  const accepted: readonly AccountRole[] = typeof roles === "string" ? [roles] : roles;
  if (!accepted.includes(user.role)) redirect(homeOf(user.role));
  return user;
}
