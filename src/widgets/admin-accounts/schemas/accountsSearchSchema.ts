import { z } from "zod";
import { stripeStatusSchema } from "@/features/hosts";
/** Somente filtros não pessoais na URL; busca é descartada pelo schema.
 * @example accountsSearchSchema.parse({ type: "hosts", stripeStatus: "rejected" })
 */
export const accountsSearchSchema = z.object({
  type: z.enum(["owners", "hosts"]).catch("owners"),
  status: z.enum(["all", "active", "inactive", "suspended", "released"]).catch("all"),
  stripeStatus: z.enum(["all", ...stripeStatusSchema.options]).catch("all"),
  page: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).catch(1),
});
