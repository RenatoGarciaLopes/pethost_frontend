import type { PayoutRequirement } from "../types";
/** Converte motivos conhecidos e desconhecidos em chaves, sem expor texto técnico. @example payoutRequirementOf("requirements.past_due") */
export function payoutRequirementOf(reason: string | null | undefined): PayoutRequirement | null {
  if (!reason) return null;
  if (reason === "requirements.past_due" || reason === "requirements.pending_verification") return "confirm";
  return reason.startsWith("requirements.") ? "complete" : "other";
}
