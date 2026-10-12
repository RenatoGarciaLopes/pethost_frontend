import type { FieldPath } from "react-hook-form";
import type { WizardStep } from "@/shared/ui/navigation/WizardProgress";
import type { OwnerRegistrationInput } from "../schemas/ownerRegistrationSchema";
import { registrationCopy } from "./registrationCopy";

type RegistrationField = FieldPath<OwnerRegistrationInput>;

interface RegistrationStep extends WizardStep {
  /** Título do passo (o `h1` da tela enquanto ele está aberto). */
  title: string;
  /** Campos validados ao tocar "Continuar" e usados para achar o passo de um erro da API. */
  fields: readonly RegistrationField[];
}

/** Os dois passos do cadastro de tutor, na ordem (REQ-OREG-002). */
export const REGISTRATION_STEPS: readonly RegistrationStep[] = [
  {
    id: "person",
    label: registrationCopy.steps.person.label,
    title: registrationCopy.steps.person.title,
    fields: ["fullName", "email", "password", "phone", "birthDate", "cpf"],
  },
  {
    id: "address",
    label: registrationCopy.steps.address.label,
    title: registrationCopy.steps.address.title,
    fields: [
      "address.zipCode",
      "address.street",
      "address.number",
      "address.complement",
      "address.neighborhood",
      "address.city",
      "address.state",
    ],
  },
];

/** Todos os campos do formulário, na ordem da tela (lista do `applyFieldErrors`). */
export const REGISTRATION_FIELDS: readonly RegistrationField[] = REGISTRATION_STEPS.flatMap((step) => step.fields);

/**
 * Primeiro passo que contém algum dos campos com erro (REQ-OREG-009), ou `undefined`.
 * @example stepIndexOf(["address.zipCode"]) // 1
 */
export function stepIndexOf(fields: readonly string[]): number | undefined {
  const index = REGISTRATION_STEPS.findIndex((step) => step.fields.some((field) => fields.includes(field)));
  return index === -1 ? undefined : index;
}
