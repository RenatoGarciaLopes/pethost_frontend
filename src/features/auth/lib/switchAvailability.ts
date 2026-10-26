import type { PersonalRole } from "@/shared/auth/contracts/session";
import type { LinkedAccount } from "../types/linkedAccount";

/**
 * Distingue destino disponível, ausente ou pausado, sem inferir contas da resposta de erro (REQ-SWITCH-003).
 * @example switchAvailability([{ role: "host", isActive: false, isCurrent: false }], "host") // "paused"
 */
export function switchAvailability(
  accounts: LinkedAccount[],
  target: PersonalRole,
): "available" | "missing" | "paused" {
  const account = accounts.find((item) => item.role === target);
  return account ? (account.isActive ? "available" : "paused") : "missing";
}
