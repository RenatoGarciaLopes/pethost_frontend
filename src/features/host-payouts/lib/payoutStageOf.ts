import type { PayoutAccount } from "../types";
import { payoutsCopy } from "./payoutsCopy";
/** Contrato da etapa 2 para a 030. O consumidor distingue erro de consulta de perfil ausente antes de passar null. @example const stage = payoutStageOf(account); */
export function payoutStageOf(account: PayoutAccount | null) {
  const state = !account
    ? "locked"
    : account.status === "rejected"
      ? "rejected"
      : account.status === "under_review"
        ? "reviewing"
        : account.status === "enabled" && account.payoutsEnabled
          ? "complete"
          : "current";
  return {
    id: "payouts" as const,
    title: payoutsCopy.title,
    state,
    label: payoutsCopy.stage[state],
    href: "/host/payments" as const,
  };
}
