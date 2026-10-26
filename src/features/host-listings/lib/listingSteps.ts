import { get, type FieldErrors, type FieldPath } from "react-hook-form";
import type { WizardStep } from "@/shared/ui/navigation/WizardProgress";
import type { ListingFormValues } from "../schemas/listingSchema";
import { listingCopy } from "./listingCopy";

export type ListingField = FieldPath<ListingFormValues>;

/** Os passos do cadastro novo (104), na ordem da conversa; o último é a revisão. */
export const LISTING_STEP_IDS = [
  "home",
  "title",
  "household",
  "guests",
  "address",
  "rules",
  "weekdays",
  "rate",
  "review",
] as const;
export type ListingStepId = (typeof LISTING_STEP_IDS)[number];

export interface ListingStep extends WizardStep {
  id: ListingStepId;
  /** Título (`h1`) do passo. */
  title: string;
  /** Frase de apoio sob o título. */
  intro: string;
  /** Como o passo aparece no botão do anterior ("Continuar: endereço"); o primeiro não tem anterior. */
  next?: string;
  /** Campos validados no "Continuar" e usados para achar o passo de um erro da API. */
  fields: readonly ListingField[];
}

const FIELDS: Readonly<Record<ListingStepId, readonly ListingField[]>> = {
  home: ["homeType", "hasYard"],
  title: ["title", "description"],
  household: ["hasDogs", "hasCats", "hasKids"],
  guests: ["acceptedSpecies", "acceptsSmall", "acceptsMedium", "acceptsLarge", "capacity"],
  address: [
    "address.zipCode",
    "address.street",
    "address.number",
    "address.complement",
    "address.neighborhood",
    "address.city",
    "address.state",
  ],
  rules: ["houseRules"],
  weekdays: ["availableWeekdays"],
  rate: ["nightlyRate"],
  review: [],
};

/** Os nove passos, com os textos e os campos de cada um. */
export const LISTING_STEPS: readonly ListingStep[] = LISTING_STEP_IDS.map((id) => ({
  id,
  ...listingCopy.wizard.steps[id],
  fields: FIELDS[id],
}));

/** Todos os campos que o assistente mostra, na ordem da tela. */
export const LISTING_FIELDS: readonly ListingField[] = LISTING_STEPS.flatMap((step) => step.fields);

/** Índice da revisão (o último passo). */
export const REVIEW_INDEX = LISTING_STEPS.length - 1;

/**
 * Campo da API → campo do formulário: o mesmo nome, ou a raiz quando a API aponta um item (`acceptedSpecies[0]`).
 * Fora do formulário, volta como veio (o erro vai para o aviso geral).
 * @example toFormField("acceptedSpecies[0]") // "acceptedSpecies"
 */
export function toFormField(field: string): string {
  if ((LISTING_FIELDS as readonly string[]).includes(field)) return field;
  const root = field.split(/[.[]/)[0]!;
  return (LISTING_FIELDS as readonly string[]).includes(root) ? root : field;
}

/**
 * Primeiro passo que tem algum dos campos, ou `undefined` (REQ-LIST-012, o mesmo mecanismo do cadastro de conta).
 * @example stepIndexOf(["address.zipCode"]) // 4
 */
export function stepIndexOf(fields: readonly string[]): number | undefined {
  const index = LISTING_STEPS.findIndex((step) => step.fields.some((field) => fields.includes(field)));
  return index === -1 ? undefined : index;
}

/**
 * Primeiro passo com erro nos campos (para retomar um rascunho antigo, sem o passo salvo); sem erro, a revisão.
 * @example firstStepWithError(listingErrors(schemas, values)) // 0 num rascunho em branco
 */
export function firstStepWithError(errors: FieldErrors<ListingFormValues>): number {
  const index = LISTING_STEPS.findIndex((step) => step.fields.some((field) => get(errors, field)));
  return index === -1 ? REVIEW_INDEX : index;
}
