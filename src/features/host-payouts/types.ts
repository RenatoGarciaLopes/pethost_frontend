import type { z } from "zod";
import type { payoutStatusSchema } from "./api/contracts";
/** Situações conhecidas do espelho do Stripe, incluindo recusa definitiva. @example const status: PayoutStatus = "enabled"; */
export type PayoutStatus = z.output<typeof payoutStatusSchema>;
/** Chave de microcopy; o motivo bruto do Stripe não chega à tela. @example const missing: PayoutRequirement = "confirm"; */
export type PayoutRequirement = "confirm" | "complete" | "other";
/** Situação segura para query cache e hidratação, sem clientSecret ou URL de onboarding. @example const account: PayoutAccount = { status: "not_started", payoutsEnabled: false, listingsVisible: false, missing: null, syncedAt: null }; */
export interface PayoutAccount {
  status: PayoutStatus;
  payoutsEnabled: boolean;
  listingsVisible: boolean;
  missing: PayoutRequirement | null;
  syncedAt: string | null;
}
