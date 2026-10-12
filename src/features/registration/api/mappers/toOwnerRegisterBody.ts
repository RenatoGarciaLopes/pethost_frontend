import { parseBrazilianDate, toIsoDate } from "@/shared/lib/date";
import type { OwnerRegistrationValues } from "../../schemas/ownerRegistrationSchema";
import type { OwnerRegisterBody } from "../contracts/ownerRegister";

/**
 * Valores validados → corpo da API (REQ-OREG-008): nascimento em `yyyy-MM-dd`; CPF, CEP e telefone
 * já só com dígitos (os campos mascarados guardam assim); complemento vazio não vai.
 *
 * @throws {Error} se o nascimento não for uma data (o schema já garante; é defesa contra uso errado)
 */
export function toOwnerRegisterBody(values: OwnerRegistrationValues): OwnerRegisterBody {
  const birthDate = parseBrazilianDate(values.birthDate);
  if (!birthDate) throw new Error("toOwnerRegisterBody: nascimento inválido");
  const { complement, ...address } = values.address;

  return {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
    phone: values.phone,
    birthDate: toIsoDate(birthDate),
    cpf: values.cpf,
    address: complement ? { ...address, complement } : address,
  };
}
