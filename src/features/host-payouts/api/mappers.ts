import type { PayoutAccount } from "../types";
import { payoutRequirementOf } from "../lib/payoutRequirementOf";
import type { StripeAccountDto } from "./contracts";
/** Projeta somente a situação e capacidades exibidas; não é um cache da sessão Stripe. @example toPayoutAccount(dto) */
export function toPayoutAccount(dto: StripeAccountDto): PayoutAccount {
  return {
    status: dto.status,
    payoutsEnabled: dto.payoutsEnabled,
    listingsVisible: dto.listingsVisible,
    missing: payoutRequirementOf(dto.disabledReason),
    syncedAt: dto.syncedAt ?? null,
  };
}
