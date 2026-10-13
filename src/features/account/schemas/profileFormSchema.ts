import { z } from "zod";
import { isAdult, parseBrazilianDate, todayCalendarDate } from "@/shared/lib/date";
import { isValidCpf } from "@/shared/lib/documents";
import { unmaskCpf, unmaskPhone } from "@/shared/lib/masks";
import { createAddressSchema } from "@/shared/lib/validation/address";
import { PASSWORD_MAX } from "@/shared/lib/validation/password";
import type { AccountProfile, Address } from "../types/accountProfile";

const addressSchema = createAddressSchema({
  zipCode: "O CEP tem 8 números.",
  street: "Falta a rua.",
  number: "Falta o número (ou S/N).",
  neighborhood: "Falta o bairro.",
  city: "Falta a cidade.",
  state: "Escolhe a UF.",
  tooLong: (max) => `Ficou comprido demais: vai até ${max} caracteres.`,
});
/**
 * Campos editáveis da conta, com regras compartilhadas da 011. CPF/nascimento vazios
 * preservam identidade nula já recebida; preenchidos precisam ser válidos e de pessoa adulta.
 * Empresa ausente não valida endereço de empresa. Senha atual é opcional e não recebe trim.
 * @example profileFormSchema.parse(toProfileFormValues(profile))
 */
export const profileFormSchema = z.object({
  fullName: z.string().trim().min(1, "Falta seu nome.").max(120, "Ficou comprido demais: vai até 120 caracteres."),
  email: z.string(),
  phone: z.string().regex(/^\d{10,11}$/, "Confere o DDD e o número."),
  birthDate: z.string().superRefine((value, context) => {
    if (!value) return;
    const date = parseBrazilianDate(value);
    if (!date) return context.addIssue({ code: z.ZodIssueCode.custom, message: "Essa data não existe." });
    if (!isAdult(date, todayCalendarDate()))
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Precisa ter 18 anos ou mais." });
  }),
  cpf: z.string().refine((value) => !value || isValidCpf(value), "Esse CPF não confere. Dá uma olhada nos números."),
  address: addressSchema,
  currentPassword: z.string().max(PASSWORD_MAX, "A senha passou de 128 caracteres.").optional().default(""),
  cnpj: z.string().default(""),
  legalName: z.string().default(""),
  tradeName: z.string().trim().max(120, "Ficou comprido demais: vai até 120 caracteres.").default(""),
  companyAddress: addressSchema.optional(),
});
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;

function formAddress(address: Address | null): ProfileFormValues["address"] {
  return {
    zipCode: address?.zipCode ?? "",
    street: address?.street ?? "",
    number: address?.number ?? "",
    complement: address?.complement ?? "",
    neighborhood: address?.neighborhood ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
  };
}
/**
 * Valores iniciais do RHF sem senha; data/CPF/telefone ficam em dígitos para os campos mascarados.
 * Não valida dados antigos ou campos travados ao montar.
 * @example const defaults = toProfileFormValues(profile);
 */
export function toProfileFormValues(profile: AccountProfile): ProfileFormValues {
  const birthDate = profile.birthDate ? profile.birthDate.split("-").reverse().join("") : "";
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: unmaskPhone(profile.phone),
    birthDate,
    cpf: unmaskCpf(profile.cpf ?? ""),
    address: formAddress(profile.address),
    currentPassword: "",
    cnpj: profile.company?.cnpj ?? "",
    legalName: profile.company?.legalName ?? "",
    tradeName: profile.company?.tradeName ?? "",
    companyAddress: profile.company ? formAddress(profile.company.address) : undefined,
  };
}
