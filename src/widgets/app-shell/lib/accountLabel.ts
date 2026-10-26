import type { AccountRole } from "@/shared/auth/contracts/session";
import { roleLabel } from "@/shared/config/roleLabels";
/** Frase neutra do menu, independente da cor ou de tratamento não disponível na API.
 * @example accountLabel("host") // "Conta de anfitrião"
 */
export function accountLabel(role: AccountRole): "Conta de tutor" | "Conta de anfitrião" | "Conta de admin" {
  return `Conta de ${roleLabel(role)}`;
}
