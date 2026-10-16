import type { ListingFormValues, ListingSectionId } from "../schemas/listingSchema";

/** As seções do cantinho, na ordem do painel (REQ-LIST-003). */
export const LISTING_SECTIONS: readonly ListingSectionId[] = [
  "home",
  "household",
  "guests",
  "address",
  "rules",
  "weekdays",
  "rate",
];

/** Os campos que cada seção edita. */
export const SECTION_FIELDS: Readonly<Record<ListingSectionId, readonly (keyof ListingFormValues)[]>> = {
  home: ["homeType", "hasYard", "title", "description"],
  household: ["hasDogs", "hasCats", "hasKids"],
  guests: ["acceptedSpecies", "acceptsSmall", "acceptsMedium", "acceptsLarge", "capacity"],
  address: ["address"],
  rules: ["houseRules"],
  weekdays: ["availableWeekdays"],
  rate: ["nightlyRate"],
};

/** Campo da API (ou do formulário) → nome no formulário: a diária da API é `nightlyRate` também. */
const rootOf = (field: string) => field.split(".")[0] as keyof ListingFormValues;

/**
 * Em que seção um campo é respondido, para levar o erro da API ao lugar certo (REQ-LIST-012).
 * @example sectionOfField("address.zipCode") // "address"
 */
export function sectionOfField(field: string): ListingSectionId | undefined {
  const root = rootOf(field);
  return LISTING_SECTIONS.find((section) => SECTION_FIELDS[section].includes(root));
}

/**
 * Os valores de uma seção sobre o cantinho inteiro (o resto não muda).
 * @example mergeSection(values, "rules", submitted)
 */
export function mergeSection(
  values: ListingFormValues,
  section: ListingSectionId,
  submitted: ListingFormValues,
): ListingFormValues {
  const picked = Object.fromEntries(SECTION_FIELDS[section].map((field) => [field, submitted[field]]));
  return { ...values, ...picked };
}
