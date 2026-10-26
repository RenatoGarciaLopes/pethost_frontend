import { z } from "zod";
import { applicationStatusSchema, commonRejectionSchema } from "../api/contracts";
import { adminReviewCopy as copy } from "../lib/adminReviewCopy";
const reason = z.string().trim().min(1, copy.reasonRequired).max(500, copy.reasonMax);
/** Filtro e página públicos; entradas inválidas voltam ao padrão seguro. @example queueSearchSchema.parse({}) */
export const queueSearchSchema = z.object({
  status: applicationStatusSchema.catch("submitted"),
  page: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).catch(1),
});
/** Aprovação exige nota curta, sem espaços vazios. @example approveSchema.parse({ reason: "Dados conferidos" }) */
export const approveSchema = z.object({ reason });
/** Recusa comum não aceita suspeita de fraude. @example rejectSchema.parse({ reason: "Foto cortada", rejectionReason: "document_illegible" }) */
export const rejectSchema = z.object({ reason, rejectionReason: commonRejectionSchema });
/** Fraude exige confirmação explícita antes de enviar a recusa final. @example fraudSchema.parse({ reason: "Nota interna", confirmed: true }) */
export const fraudSchema = z.object({ reason, confirmed: z.literal(true) });
