import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { LISTING_BADGES } from "@/shared/config/listingBadges";
import {
  GetApiV1ListingsListingIdCompatibilityResponse,
  GetApiV1ListingsResponse,
} from "@/shared/api/generated/listings/listings.zod";

const page = unwrapData(GetApiV1ListingsResponse);
/** Espécies documentadas da API, compartilhadas entre URL e resposta. @example listingSpeciesSchema.parse("dog") */
export const listingSpeciesSchema = z.enum([
  "dog",
  "cat",
  "cockatiel",
  "parrot",
  "parakeet",
  "canary",
  "rabbit",
  "hamster",
  "guinea_pig",
  "fish",
  "turtle",
  "exotic",
]);
/** Resposta real estreitada; valores novos exigem atualização explícita. @example listingSummarySchema.parse(dto) */
export const listingSummarySchema = page.shape.items.element.extend({
  homeType: z.enum(["house", "apartment"]).nullish(),
  acceptedSpecies: z.array(listingSpeciesSchema),
  badges: z.array(z.enum(LISTING_BADGES)),
});
/** Página da busca sem envelope. @example searchPageSchema.parse(data) */
export const searchPageSchema = page.extend({ items: z.array(listingSummarySchema) });
/** Modelo público validado da busca. @example const listing: ListingSummary = listingSummarySchema.parse(dto); */
export type ListingSummary = z.output<typeof listingSummarySchema>;
/** Aviso de "Combina com seu pet" sem envelope; o código vira texto no app. @example compatibilitySchema.parse(data) */
export const compatibilitySchema = unwrapData(GetApiV1ListingsListingIdCompatibilityResponse);
/** Resultado validado da compatibilidade de um pet com um cantinho. */
export type ListingCompatibility = z.output<typeof compatibilitySchema>;
