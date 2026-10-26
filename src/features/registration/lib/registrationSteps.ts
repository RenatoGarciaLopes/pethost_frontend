import type { FieldPath } from "react-hook-form";
import type { WizardStep } from "@/shared/ui/navigation/WizardProgress";
import type { RegistrationInput } from "../schemas/registrationSchemas";
import { registrationCopy } from "./registrationCopy";

export type RegistrationField = FieldPath<RegistrationInput>;

export interface RegistrationStep extends WizardStep {
  /** Título do passo (o `h1` da tela enquanto ele está aberto). */
  title: string;
  /** Campos validados ao tocar "Continuar" e usados para achar o passo de um erro da API. */
  fields: readonly RegistrationField[];
}

const ADDRESS_FIELDS: readonly RegistrationField[] = [
  "address.zipCode",
  "address.street",
  "address.number",
  "address.complement",
  "address.neighborhood",
  "address.city",
  "address.state",
];

/**
 * Os dois passos do cadastro, na ordem (REQ-OREG-002, REQ-HREG-001): "Você", com os campos de pessoa
 * da variante, e "Onde você mora", igual nas duas.
 * @example registrationSteps(["fullName", "email"]).map((step) => step.id) // ["person", "address"]
 */
export function registrationSteps(personFields: readonly RegistrationField[]): readonly RegistrationStep[] {
  return [
    {
      id: "person",
      label: registrationCopy.steps.person.label,
      title: registrationCopy.steps.person.title,
      description: personFields.includes("cpf")
        ? registrationCopy.steps.person.description
        : registrationCopy.steps.person.hostDescription,
      fields: personFields,
    },
    {
      id: "address",
      label: registrationCopy.steps.address.label,
      title: registrationCopy.steps.address.title,
      description: personFields.includes("cpf")
        ? registrationCopy.steps.address.description
        : registrationCopy.steps.address.hostDescription,
      fields: ADDRESS_FIELDS,
    },
  ];
}

/**
 * Primeiro passo que contém algum dos campos com erro (REQ-OREG-009), ou `undefined`.
 * @example stepIndexOf(steps, ["address.zipCode"]) // 1
 */
export function stepIndexOf(steps: readonly RegistrationStep[], fields: readonly string[]): number | undefined {
  const index = steps.findIndex((step) => step.fields.some((field) => fields.includes(field)));
  return index === -1 ? undefined : index;
}
