import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { resolvePostLoginPath } from "@/shared/config/appRoutes";
import { getSession } from "./getSession";

/**
 * Guarda das telas de quem ainda não entrou (entrar, criar conta): com sessão, vai direto para o
 * `next` seguro ou para a casa do papel, sem mostrar o formulário (REQ-AUTH-014, REQ-OREG-015).
 * Espera `connection()` antes de ler cookie/relógio e deve ser chamado dentro de `<Suspense>` (Cache Components).
 *
 * @example await redirectIfSignedIn(next);
 */
export async function redirectIfSignedIn(next: string | null): Promise<void> {
  await connection();
  const user = await getSession();
  if (user) redirect(resolvePostLoginPath(user.role, next));
}
