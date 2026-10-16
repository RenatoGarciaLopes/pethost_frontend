import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { WEEKDAY_VALUES } from "@/shared/ui/forms/WeekdayPicker";
import { GetApiV1HostsMeResponse } from "@/shared/api/generated/hosts/hosts.zod";
import {
  GetApiV1ListingsListingIdResponse,
  GetApiV1ListingsMeResponse,
} from "@/shared/api/generated/listings/listings.zod";

/** Os 12 tipos que um cantinho aceita, na ordem da lista da API (`modulo-listings.md` 3.1). */
export const LISTING_SPECIES = [
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
] as const;
/** Dias em que recebe, de segunda a domingo (os mesmos do `WeekdayPicker`). */
export const WEEKDAYS = WEEKDAY_VALUES;
export const HOME_TYPES = ["house", "apartment"] as const;

/** A API aceita maiúsculas na entrada; a leitura normaliza antes de estreitar. */
const lowercaseEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (typeof value === "string" ? value.toLowerCase() : value), z.enum(values));

/**
 * O cantinho como o dono vê, com tipo da casa, espécies e dias estreitados. Valor desconhecido = `CONTRACT_MISMATCH`.
 * @example listingDtoSchema.parse(data)
 */
export const listingDtoSchema = unwrapData(GetApiV1ListingsListingIdResponse).extend({
  homeType: lowercaseEnum([...HOME_TYPES]).nullish(),
  acceptedSpecies: z.array(lowercaseEnum([...LISTING_SPECIES])),
  availableWeekdays: z.array(lowercaseEnum([...WEEKDAYS])),
});

/**
 * `GET /listings/me`: o anfitrião uma vez (empresa? recebimento liberado?) e os cantinhos, do mais novo ao mais antigo.
 * @example myListingsSchema.parse(data)
 */
export const myListingsSchema = unwrapData(GetApiV1ListingsMeResponse).extend({ listings: z.array(listingDtoSchema) });

/**
 * `GET /hosts/me` (perfil do anfitrião verificado): tipo de pessoa, nome e endereço da conta (sugestões do cadastro) e a
 * situação do recebimento (`stripePayoutsEnabled`, `stripeStatus`), sem depender da feature do Stripe (043).
 * @example hostMeSchema.parse(data)
 */
export const hostMeSchema = unwrapData(GetApiV1HostsMeResponse);

export type ListingDto = z.output<typeof listingDtoSchema>;
export type MyListingsDto = z.output<typeof myListingsSchema>;
export type HostMeDto = z.output<typeof hostMeSchema>;
