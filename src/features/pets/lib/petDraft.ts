import { z } from "zod";
import { petProfileDraftValuesSchema, type PetProfileValues } from "../schemas/petProfileSchema";
/** Chave exclusiva da conta, sem identificador de pet. @example petDraftKey("account-1") */
export const petDraftKey = (accountId: string): string => `pethost:pet-draft:${accountId}`;
/** Só passo 1 a 7 e dados parciais da ficha; desconhecidos, fotos e microchip são descartados. @example petDraftSchema.parse({ step: 1, values: {} }) */
export const petDraftSchema = z.object({ step: z.number().int().min(1).max(7), values: petProfileDraftValuesSchema });
/** Constrói rascunho seguro a partir do estado em memória. @example toPetDraft(2, { name: "Mel" }) */
export function toPetDraft(step: number, values: Partial<PetProfileValues>): z.output<typeof petDraftSchema> {
  return petDraftSchema.parse({ step, values });
}
