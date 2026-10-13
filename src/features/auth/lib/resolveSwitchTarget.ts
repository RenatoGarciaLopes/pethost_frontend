import type { PersonalRole } from "@/shared/auth/contracts/session";

/**
 * Resolve o destino pessoal; ausente, inválido ou igual ao atual escolhe a outra conta (REQ-SWITCH-011).
 * @example resolveSwitchTarget("owner", "host") // "host"
 */
export function resolveSwitchTarget(current: PersonalRole, to: string | undefined): PersonalRole {
  if ((to === "owner" || to === "host") && to !== current) return to;
  return current === "owner" ? "host" : "owner";
}
