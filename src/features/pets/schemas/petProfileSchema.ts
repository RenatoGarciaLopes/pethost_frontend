import { z } from "zod";
import { todayCalendarDate, toIsoDate } from "@/shared/lib/date/brazilianDate";
import { petSpeciesSchema, petSizeSchema, petSexSchema } from "../api/contracts";
import type { PetSpecies } from "../types";
import { petsCopy } from "../lib/petsCopy";
import { requiresSize, requiresDescription, allowsSize, pruneForSpecies } from "../lib/species";
import { normalizeMicrochip } from "../lib/normalizeMicrochip";
const copy = petsCopy.fieldErrors;
const blankToUndefined = (value: unknown) => (typeof value === "string" ? value.trim() || undefined : value);
const optionalText = (max: number, message: string) =>
  z.preprocess(blankToUndefined, z.string().max(max, message).optional());
const localized = <T extends z.ZodTypeAny>(schema: T, message: string) =>
  z
    .custom<z.output<T>>((value) => schema.safeParse(value).success, { message })
    .transform((value) => schema.parse(value) as z.output<T>);
const choice = z.boolean({ required_error: copy.boolean, invalid_type_error: copy.boolean });
const species = {
  species: localized(petSpeciesSchema, copy.species),
  speciesDescription: optionalText(60, copy.max60),
};
const identity = {
  name: z.string({ required_error: copy.name }).trim().min(1, copy.name).max(60, copy.max60),
  sex: localized(petSexSchema, copy.sex),
};
const body = {
  breed: optionalText(60, copy.max60),
  size: z.preprocess(blankToUndefined, localized(petSizeSchema, copy.size).optional()),
  birthDate: z.preprocess(
    blankToUndefined,
    z
      .string()
      .date(copy.birthDate)
      .refine((value) => {
        return value <= toIsoDate(todayCalendarDate());
      }, copy.birthDate)
      .optional(),
  ),
  weightKg: z
    .number({ invalid_type_error: copy.weight })
    .positive(copy.weight)
    .max(150, copy.weight)
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8, copy.weight)
    .optional(),
};
const health = {
  isVaccinated: choice,
  isNeutered: choice,
  medicationNotes: optionalText(1000, copy.max1000),
  allergies: optionalText(1000, copy.max1000),
  vetContact: optionalText(160, copy.max160),
  microchip: z.preprocess(
    blankToUndefined,
    z
      .string()
      .refine((value) => normalizeMicrochip(value) !== null, copy.microchip)
      .transform((value) => normalizeMicrochip(value)!)
      .optional(),
  ),
};
const routine = { feedingNotes: optionalText(1000, copy.max1000), notes: optionalText(2000, copy.max2000) };
const social = { goodWithDogs: choice, goodWithCats: choice, goodWithKids: choice };
function refineSpecies(value: { species: PetSpecies; speciesDescription?: string }, context: z.RefinementCtx) {
  if (requiresDescription(value.species) && !value.speciesDescription)
    context.addIssue({ code: "custom", path: ["speciesDescription"], message: copy.speciesDescription });
}
function refineSize(species: PetSpecies, size: unknown, context: z.RefinementCtx) {
  if (requiresSize(species) && !size) context.addIssue({ code: "custom", path: ["size"], message: copy.size });
}
const profileObject = z.object({ ...species, ...identity, ...body, ...health, ...routine, ...social });
/** Ficha validada e podada por espécie (REQ-PNEW-023). @example petProfileSchema.parse(values) */
export const petProfileSchema = profileObject
  .superRefine((value, context) => {
    refineSpecies(value, context);
    refineSize(value.species, value.size, context);
  })
  .transform(pruneForSpecies);
export type PetProfileValues = z.output<typeof petProfileSchema>;
/** Recortes independentes dos cinco passos sem contexto externo. @example petStepSchemas.identity.parse({ name: "Mel", sex: "unknown" }) */
export const petStepSchemas = {
  species: z.object(species).superRefine(refineSpecies),
  identity: z.object(identity),
  health: z.object(health),
  routine: z.object(routine),
  social: z.object(social),
};
/**
 * Corpo recebe espécie do store, nunca como campo do formulário. Gato aceita porte existente, sem exigi-lo. Na
 * edição, peso já informado não pode ficar em branco (`keepWeight`, REQ-PEDIT-006: a API troca, não apaga).
 * @example bodyStepSchema("dog").safeParse({ size: "small" })
 * @example bodyStepSchema("cat", { keepWeight: true }).safeParse({}) // falha: falta o peso
 */
export function bodyStepSchema(species: PetSpecies, { keepWeight = false }: { keepWeight?: boolean } = {}) {
  return z
    .object(body)
    .superRefine((value, context) => {
      refineSize(species, value.size, context);
      if (keepWeight && value.weightKg === undefined)
        context.addIssue({ code: "custom", path: ["weightKg"], message: copy.weightRequired });
    })
    .transform((value) => {
      if (allowsSize(species)) return value;
      const pruned = { ...value };
      delete pruned.size;
      return pruned;
    });
}
/** Parcial de rascunho: mesmas regras de campos, sem exigir conclusão. @example petProfileDraftValuesSchema.parse({ species: "dog" }) */
export const petProfileDraftValuesSchema = profileObject.omit({ microchip: true }).partial();
/**
 * Seção "Bicho" da edição (REQ-PEDIT-007): virar cachorro pede o porte na mesma seção; virar exótico, a
 * descrição. Gato mantém o porte que tiver.
 * @example speciesSectionSchema.safeParse({ species: "dog" }) // falha: falta o porte
 */
export const speciesSectionSchema = z
  .object({ ...species, size: body.size })
  .superRefine((value, context) => {
    refineSpecies(value, context);
    refineSize(value.species, value.size, context);
  })
  .transform(pruneForSpecies);
