import { z } from "zod";
import type { ListingFormValues, ListingSectionId } from "../schemas/listingSchema";
import { LISTING_SECTIONS } from "./listingSections";

const yesNo = z.boolean().nullable();
const valuesSchema: z.ZodType<ListingFormValues> = z.object({
  homeType: z.enum(["", "house", "apartment"]),
  hasYard: yesNo,
  title: z.string(),
  description: z.string(),
  hasDogs: yesNo,
  hasCats: yesNo,
  hasKids: yesNo,
  acceptedSpecies: z.array(z.string()),
  acceptsSmall: z.boolean(),
  acceptsMedium: z.boolean(),
  acceptsLarge: z.boolean(),
  capacity: z.number().int(),
  address: z.object({
    zipCode: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
  }),
  houseRules: z.string(),
  availableWeekdays: z.array(z.string()),
  nightlyRate: z.string(),
});

/**
 * Chave do rascunho do cantinho na sessão do navegador, por conta (REQ-LIST-004). Nada de foto nem documento.
 * @example listingDraftKey(user.id) // "pethost:listing-draft:<id>"
 */
export const listingDraftKey = (accountId: string): string => `pethost:listing-draft:${accountId}`;

/**
 * O rascunho: os valores e as seções que a pessoa já salvou. Desconhecido é descartado na leitura.
 * @example listingDraftSchema.parse({ values, done: ["home"] })
 */
export const listingDraftSchema = z.object({
  values: valuesSchema,
  done: z.array(z.enum(LISTING_SECTIONS as [ListingSectionId, ...ListingSectionId[]])),
});

export type ListingDraft = z.output<typeof listingDraftSchema>;
