import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { homeOf } from "@/shared/config/appRoutes";
import type { RegisterPath } from "../api/client/registration.client";
import type { RegisterBody } from "../api/contracts/registerBodies";
import { toHostRegisterBody, toOwnerRegisterBody } from "../api/mappers/toRegisterBody";
import {
  hostRegistrationSchema,
  ownerRegistrationSchema,
  type RegistrationInput,
} from "../schemas/registrationSchemas";
import { registrationCopy } from "./registrationCopy";
import { registrationSteps, type RegistrationField, type RegistrationStep } from "./registrationSteps";

const { steps, fields, dataUse, success } = registrationCopy;

type DataUseItem = (typeof dataUse.items)[keyof typeof dataUse.items];

/** Um jeito de criar conta de pessoa: o que muda entre tutor (spec 011) e anfitrião (spec 012). */
export interface RegistrationVariant {
  role: PersonalRole;
  /** Rota do BFF do cadastro. */
  path: RegisterPath;
  /** Valida o formulário e já devolve o corpo da API (schema da variante seguido do mapper). */
  resolver: Resolver<RegistrationInput, unknown, RegisterBody>;
  steps: readonly RegistrationStep[];
  /** Todos os campos, na ordem da tela (lista do `applyFieldErrors`). */
  fields: readonly RegistrationField[];
  /** Ajuda abaixo do título de cada passo. */
  intro: { person?: string; address: string };
  /** Ajuda do campo de senha. */
  passwordHelp?: string;
  /** Faixa "o que a gente faz com cada dado". */
  dataUse: readonly DataUseItem[];
  /** Tela de sucesso: a frase e o próximo passo principal; "Fazer isso depois" leva à casa do papel. */
  success: { message: string; nextStep: { label: string; href: string }; laterHref: string };
}

const PERSON_FIELDS = ["fullName", "email", "password", "phone", "birthDate"] as const;

function variant(
  config: Omit<RegistrationVariant, "fields" | "steps"> & { personFields: readonly RegistrationField[] },
) {
  const { personFields, ...rest } = config;
  const variantSteps = registrationSteps(personFields);
  return { ...rest, steps: variantSteps, fields: variantSteps.flatMap((step) => step.fields) };
}

/**
 * As duas variantes do cadastro (spec 012, design "A variante vive numa tabela"): cada componente lê daqui,
 * nada de `if (role === …)` espalhado. Variante nova entra como linha nova.
 *
 * @example const { steps, resolver } = REGISTRATION_VARIANTS.host
 */
export const REGISTRATION_VARIANTS: Readonly<Record<PersonalRole, RegistrationVariant>> = {
  owner: variant({
    role: "owner",
    path: "/owners/register",
    resolver: zodResolver(ownerRegistrationSchema.transform(toOwnerRegisterBody)),
    personFields: [...PERSON_FIELDS, "cpf"],
    intro: { address: steps.address.why },
    dataUse: [dataUse.items.contact, dataUse.items.cpf, dataUse.items.address, dataUse.items.password],
    success: {
      message: success.owner,
      nextStep: { label: success.addPet, href: "/pets/new" },
      laterHref: homeOf("owner"),
    },
  }),
  host: variant({
    role: "host",
    path: "/users/register",
    // O formulário é um só (com `cpf` vazio, sem campo na tela); o mapper do anfitrião não leva o CPF.
    resolver: zodResolver(hostRegistrationSchema.extend({ cpf: z.string() }).transform(toHostRegisterBody)),
    personFields: PERSON_FIELDS,
    intro: { person: steps.person.hostIntro, address: steps.address.hostWhy },
    passwordHelp: fields.hostPasswordHelp,
    dataUse: [dataUse.items.hostContact, dataUse.items.hostAddress, dataUse.items.password],
    success: {
      message: success.host,
      nextStep: { label: success.startVerification, href: "/host/application" },
      laterHref: homeOf("host"),
    },
  }),
};
