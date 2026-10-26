import { parseBrazilianDate, toIsoDate } from "@/shared/lib/date";
import { unmaskCpf, unmaskPhone } from "@/shared/lib/masks";
import type { ProfileFormValues } from "../schemas/profileFormSchema";
import type { AccountProfilePatch } from "../types/accountProfile";
const apiDate = (value: string) => {
  const date = parseBrazilianDate(value);
  return date ? toIsoDate(date) : "";
};
/** Compara identidade normalizada, sem confundir máscara com mudança. @example needsCurrentPassword(initial, values) */
export function needsCurrentPassword(initial: ProfileFormValues, values: ProfileFormValues): boolean {
  return unmaskCpf(initial.cpf) !== unmaskCpf(values.cpf) || apiDate(initial.birthDate) !== apiDate(values.birthDate);
}
/**
 * Só mudanças vão ao PATCH. Endereços seguem inteiros; complemento apagado segue como vazio.
 * Senha atual acompanha apenas mudança de CPF/nascimento. Recebe valores validados pelo schema.
 * @example const patch = diffProfile(toProfileFormValues(profile), values);
 */
export function diffProfile(initial: ProfileFormValues, values: ProfileFormValues): AccountProfilePatch {
  const patch: AccountProfilePatch = {};
  for (const field of ["fullName", "cnpj", "legalName", "tradeName"] as const) {
    if (initial[field] !== values[field]) patch[field] = values[field];
  }
  if (unmaskPhone(initial.phone) !== unmaskPhone(values.phone)) patch.phone = unmaskPhone(values.phone);
  if (unmaskCpf(initial.cpf) !== unmaskCpf(values.cpf)) patch.cpf = unmaskCpf(values.cpf);
  if (apiDate(initial.birthDate) !== apiDate(values.birthDate)) patch.birthDate = apiDate(values.birthDate);
  for (const field of ["address", "companyAddress"] as const) {
    const address = values[field];
    if (
      address &&
      Object.keys(address).some(
        (key) => initial[field]?.[key as keyof typeof address] !== address[key as keyof typeof address],
      )
    ) {
      patch[field] = { ...address, complement: address.complement ?? "" };
    }
  }
  if (needsCurrentPassword(initial, values) && values.currentPassword) patch.currentPassword = values.currentPassword;
  return patch;
}
