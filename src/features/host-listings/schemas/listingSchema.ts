import { z } from "zod";
import { createAddressSchema } from "@/shared/lib/validation";
import { HOME_TYPES, LISTING_SPECIES, WEEKDAYS } from "../api/contracts";
import { listingCopy } from "../lib/listingCopy";
import type { HostKind } from "../types";

const errors = listingCopy.errors;
const TITLE_MAX = 80;
const DESCRIPTION_MAX = 4000;
const HOUSE_RULES_MAX = 2000;
/** Capacidade máxima por tipo de anfitrião (`modulo-listings.md` 4). */
const CAPACITY_MAX: Readonly<Record<HostKind, number>> = { person: 10, company: 200 };
/** Diária por pet, em centavos: de R$ 10,00 a R$ 10.000,00. */
const RATE_MIN_CENTS = 1000;
const RATE_MAX_CENTS = 1000000;

/**
 * Valores do formulário do cantinho: a mesma forma no rascunho (sessão do navegador) e na edição. Sem resposta =
 * `null` nos sim/não e texto vazio; a diária fica em texto ("60,00") como a pessoa digita.
 */
export interface ListingFormValues {
  homeType: "" | "house" | "apartment";
  hasYard: boolean | null;
  title: string;
  description: string;
  hasDogs: boolean | null;
  hasCats: boolean | null;
  hasKids: boolean | null;
  acceptedSpecies: string[];
  acceptsSmall: boolean;
  acceptsMedium: boolean;
  acceptsLarge: boolean;
  capacity: number;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  houseRules: string;
  availableWeekdays: string[];
  nightlyRate: string;
}

/** Cantinho em branco, ponto de partida do rascunho. */
export const emptyListingValues: ListingFormValues = {
  homeType: "",
  hasYard: null,
  title: "",
  description: "",
  hasDogs: null,
  hasCats: null,
  hasKids: null,
  acceptedSpecies: [],
  acceptsSmall: false,
  acceptsMedium: false,
  acceptsLarge: false,
  capacity: 1,
  address: { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" },
  houseRules: "",
  availableWeekdays: [],
  nightlyRate: "",
};

/**
 * Diária digitada ("60,50", "R$ 75", "10.000,00") → centavos; `null` se não for um valor com até 2 casas.
 * @example parseRateCents("60,50") // 6050
 */
export function parseRateCents(text: string): number | null {
  const clean = text.replace(/R\$|\s/g, "");
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(clean);
  if (!match) return null;
  const reais = Number(match[1]!.replace(/\./g, ""));
  const cents = Number((match[2] ?? "0").padEnd(2, "0"));
  return reais * 100 + cents;
}

const yesNo = z.boolean({ invalid_type_error: errors.yesNo, required_error: errors.yesNo });
const catOrDog = (species: readonly string[]) => species.includes("dog") || species.includes("cat");

function homeShape(kind: HostKind) {
  const base = {
    hasYard: yesNo,
    title: z.string().trim().min(1, errors.title).max(TITLE_MAX, errors.titleLength),
    description: z.string().trim().min(1, errors.description).max(DESCRIPTION_MAX, errors.tooLong(DESCRIPTION_MAX)),
  };
  return kind === "person"
    ? { ...base, homeType: z.enum(HOME_TYPES, { errorMap: () => ({ message: errors.homeType }) }) }
    : base;
}

function guestsShape(kind: HostKind) {
  const max = CAPACITY_MAX[kind];
  return {
    acceptedSpecies: z.array(z.enum(LISTING_SPECIES)).min(1, errors.species),
    acceptsSmall: z.boolean(),
    acceptsMedium: z.boolean(),
    acceptsLarge: z.boolean(),
    capacity: z.number().int().min(1, errors.capacity(max)).max(max, errors.capacity(max)),
  };
}

/** Com cachorro ou gato aceito, ao menos um porte; sem eles, os portes não contam. */
function requireSizes(
  value: { acceptedSpecies: readonly string[]; acceptsSmall: boolean; acceptsMedium: boolean; acceptsLarge: boolean },
  context: z.RefinementCtx,
) {
  if (catOrDog(value.acceptedSpecies) && !value.acceptsSmall && !value.acceptsMedium && !value.acceptsLarge)
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["acceptsSmall"], message: errors.sizes });
}

const rateShape = {
  nightlyRate: z.string().refine((text) => {
    const cents = parseRateCents(text);
    return cents !== null && cents >= RATE_MIN_CENTS && cents <= RATE_MAX_CENTS;
  }, errors.rate),
};
const toRateCents = <T extends { nightlyRate: string }>({ nightlyRate, ...rest }: T) => ({
  ...rest,
  nightlyRateCents: parseRateCents(nightlyRate)!,
});

/**
 * Os schemas do cantinho para o tipo de anfitrião (REQ-LIST-003 a 010): um por seção (o painel marca "pronta" quando
 * a seção passa) e o do cantinho inteiro (abrir e editar). Pessoa física exige o tipo da casa e vai até 10 pets;
 * empresa não tem tipo e vai até 200. A saída troca a diária em texto por `nightlyRateCents`.
 *
 * @example const { sections, listing } = createListingSchemas("person"); sections.home.safeParse(values).success
 */
export function createListingSchemas(kind: HostKind) {
  const address = { address: createAddressSchema(errors.address) };
  const household = { hasDogs: yesNo, hasCats: yesNo, hasKids: yesNo };
  const rules = { houseRules: z.string().trim().max(HOUSE_RULES_MAX, errors.tooLong(HOUSE_RULES_MAX)) };
  const weekdays = { availableWeekdays: z.array(z.enum(WEEKDAYS)).min(1, errors.weekdays) };
  return {
    sections: {
      home: z.object(homeShape(kind)),
      household: z.object(household),
      guests: z.object(guestsShape(kind)).superRefine(requireSizes),
      address: z.object(address),
      rules: z.object(rules),
      weekdays: z.object(weekdays),
      rate: z.object(rateShape).transform(toRateCents),
    },
    listing: z
      .object({
        ...homeShape(kind),
        ...household,
        ...guestsShape(kind),
        ...address,
        ...rules,
        ...weekdays,
        ...rateShape,
      })
      .superRefine(requireSizes)
      .transform(toRateCents),
  };
}

export type ListingSchemas = ReturnType<typeof createListingSchemas>;
export type ListingSectionId = keyof ListingSchemas["sections"];
/** O cantinho inteiro, validado: diária em centavos; `homeType` só na pessoa física. */
export type ListingValues = z.output<ListingSchemas["listing"]> & { homeType?: "house" | "apartment" };
