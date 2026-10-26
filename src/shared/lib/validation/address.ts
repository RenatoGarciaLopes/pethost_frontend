import { z } from "zod";
import { ADDRESS_LIMITS, BRAZIL_STATES } from "../address";

/** Frases de erro do endereço, escritas por quem usa (voz da tela). */
export interface AddressMessages {
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  tooLong: (max: number) => string;
}

const STATES: readonly string[] = BRAZIL_STATES;

/**
 * Schema do endereço com as regras do `Address` da API (`modulo-auth.md` 5.1): CEP com 8 dígitos
 * (guardado só com dígitos), rua, número, bairro e cidade obrigatórios e aparados, número aceita "S/N",
 * complemento opcional (vazio vira `""`), UF entre as 27 (normalizada em maiúsculas).
 * As mensagens vêm de quem usa; a API continua sendo a fonte e o 400 dela vence.
 *
 * @example const addressSchema = createAddressSchema(registrationCopy.addressErrors);
 */
export function createAddressSchema(messages: AddressMessages) {
  const required = (message: string, max: number) => z.string().trim().min(1, message).max(max, messages.tooLong(max));

  return z.object({
    zipCode: z.string().regex(/^\d{8}$/, messages.zipCode),
    street: required(messages.street, ADDRESS_LIMITS.street),
    number: required(messages.number, ADDRESS_LIMITS.number).transform((value) =>
      /^s\s*\/\s*n$/i.test(value) ? "S/N" : value,
    ),
    complement: z.string().trim().max(ADDRESS_LIMITS.complement, messages.tooLong(ADDRESS_LIMITS.complement)),
    neighborhood: required(messages.neighborhood, ADDRESS_LIMITS.neighborhood),
    city: required(messages.city, ADDRESS_LIMITS.city),
    state: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => STATES.includes(value), messages.state),
  });
}
