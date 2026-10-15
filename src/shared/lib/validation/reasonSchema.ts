import { z } from "zod";
/** Corpo de ação administrativa com motivo obrigatório aparado, entre 1 e 500 caracteres.
 * Não usar em operações que não recebem motivo (como DELETE de suspensão).
 * @example reasonSchema.parse({ reason: "Dados conferidos" })
 */
export const reasonSchema = z.object({ reason: z.string().trim().min(1, "Escreva o motivo.").max(500, "Use até 500 caracteres.") });
