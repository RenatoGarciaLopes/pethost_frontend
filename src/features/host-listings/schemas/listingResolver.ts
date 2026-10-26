import type { FieldErrors, Resolver } from "react-hook-form";
import type { ZodError, ZodTypeAny } from "zod";
import type { ListingFormValues, ListingSchemas } from "./listingSchema";

/**
 * Problemas do Zod no formato aninhado do RHF (`address.zipCode` vira `{ address: { zipCode } }`); o primeiro de cada
 * campo.
 * @example toFieldErrors(schemas.sections.home.safeParse(values).error!)
 */
export function toFieldErrors(error: ZodError): FieldErrors<ListingFormValues> {
  const errors: Record<string, unknown> = {};
  for (const issue of error.issues) {
    let node = errors;
    issue.path.forEach((part, index) => {
      const key = String(part);
      if (index === issue.path.length - 1) node[key] ??= { type: issue.code, message: issue.message };
      else node = (node[key] ??= {}) as Record<string, unknown>;
    });
  }
  return errors as FieldErrors<ListingFormValues>;
}

/**
 * Os erros do cantinho inteiro, seção por seção (`createListingSchemas(...).sections`). Cada seção se valida sozinha:
 * o porte de "Quem você recebe" é conferido mesmo com o endereço ainda vazio (um schema só pararia no primeiro
 * problema de outra seção e pularia o refinamento).
 * @example listingErrors(schemas, values).title?.message // "Falta o título do cantinho."
 */
export function listingErrors(schemas: ListingSchemas, values: ListingFormValues): FieldErrors<ListingFormValues> {
  const errors: FieldErrors<ListingFormValues> = {};
  for (const schema of Object.values(schemas.sections) as ZodTypeAny[]) {
    const result = schema.safeParse(values);
    if (!result.success) Object.assign(errors, toFieldErrors(result.error));
  }
  return errors;
}

/**
 * Resolver do formulário único do cadastro em passos (104): valida pelos schemas das seções e devolve os valores do
 * formulário como estão (a diária em centavos sai do schema do cantinho inteiro, na hora de abrir).
 * @example useForm<ListingFormValues>({ resolver: listingResolver(schemas), mode: "onTouched" })
 */
export function listingResolver(schemas: ListingSchemas): Resolver<ListingFormValues> {
  return (values) => {
    const errors = listingErrors(schemas, values);
    return Object.keys(errors).length === 0 ? { values, errors: {} } : { values: {}, errors };
  };
}
