import { parseBrazilianDate, toIsoDate } from "@/shared/lib/date";
import type { HostRegistrationValues, OwnerRegistrationValues } from "../../schemas/registrationSchemas";
import type { HostRegisterBody, OwnerRegisterBody } from "../contracts/registerBodies";

/**
 * Valores validados do anfitrião → corpo da API (REQ-HREG-004): nascimento em `yyyy-MM-dd`; CEP e telefone
 * já só com dígitos (os campos mascarados guardam assim); complemento vazio não vai; sem CPF e sem papel.
 *
 * @throws {Error} se o nascimento não for uma data (o schema já garante; é defesa contra uso errado)
 */
export function toHostRegisterBody(values: HostRegistrationValues): HostRegisterBody {
  const birthDate = parseBrazilianDate(values.birthDate);
  if (!birthDate) throw new Error("toRegisterBody: nascimento inválido");
  const { complement, ...address } = values.address;

  return {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
    phone: values.phone,
    birthDate: toIsoDate(birthDate),
    address: complement ? { ...address, complement } : address,
  };
}

/**
 * Valores validados do tutor → corpo da API (REQ-OREG-008): o mesmo do anfitrião mais o CPF (só dígitos).
 * @throws {Error} se o nascimento não for uma data
 */
export function toOwnerRegisterBody(values: OwnerRegistrationValues): OwnerRegisterBody {
  return { ...toHostRegisterBody(values), cpf: values.cpf };
}
