import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1HostsHostIdResponse } from "@/shared/api/generated/hosts-admin/hosts-admin.zod";
const generated = unwrapData(GetApiV1HostsHostIdResponse);
/** Situações de recebimento aceitas pelo GET /hosts, incluindo rejeição definitiva.
 * @example stripeStatusSchema.parse("rejected")
 */
export const stripeStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "under_review",
  "restricted",
  "rejected",
  "enabled",
]);
/** Perfil administrativo verificado, derivado do gerado hosts-admin; preserva evidências de identidade liberada.
 * @example adminHostSchema.parse(dto)
 */
export const adminHostSchema = generated.extend({
  personType: z.enum(["pf", "pj"]),
  stripeStatus: stripeStatusSchema,
  user: generated.shape.user
    .unwrap()
    .options[1].extend({ role: z.literal("host") })
    .nullish(),
});
/** Lista administrativa, já filtrada por recebimento na API. @example adminHostListSchema.parse([]) */
export const adminHostListSchema = z.array(adminHostSchema);
/** Modelo de anfitrião derivado do gerado. @example const host: AdminHost = adminHostSchema.parse(dto); */
export type AdminHost = z.output<typeof adminHostSchema>;
/** Status que pode ir para a URL pública do filtro. @example const status: StripeStatus = "restricted"; */
export type StripeStatus = z.output<typeof stripeStatusSchema>;
