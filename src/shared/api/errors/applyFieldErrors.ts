import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { isApiError } from "./ApiError";

export interface ApplyFieldErrorsOptions<TValues extends FieldValues> {
  /**
   * Campos que o formulário mostra. O que vier da API fora desta lista vai para `root.server`,
   * para a mensagem não sumir. Sem a lista, todo campo é aplicado como veio.
   */
  fields?: readonly FieldPath<TValues>[];
}

/**
 * Leva os `fieldErrors` de um `ApiError` (400 `VALIDATION_ERROR`) aos campos do React Hook Form,
 * inclusive os aninhados (`address.zipCode`), e foca o primeiro campo com erro.
 *
 * @returns os campos que receberam erro, na ordem da API.
 * @example onError: (error) => applyFieldErrors(form.setError, error, { fields: ["email", "password"] })
 */
export function applyFieldErrors<TValues extends FieldValues>(
  setError: UseFormSetError<TValues>,
  error: unknown,
  options: ApplyFieldErrorsOptions<TValues> = {},
): FieldPath<TValues>[] {
  if (!isApiError(error)) return [];

  const known = options.fields ? new Set<string>(options.fields) : undefined;
  const applied: FieldPath<TValues>[] = [];
  const orphanMessages: string[] = [];

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (known && !known.has(field)) {
      orphanMessages.push(...messages);
      continue;
    }
    const name = field as FieldPath<TValues>;
    setError(name, { type: "server", message: messages.join(" ") }, { shouldFocus: applied.length === 0 });
    applied.push(name);
  }

  if (orphanMessages.length > 0) {
    setError("root.server", { type: "server", message: orphanMessages.join(" ") });
  }

  return applied;
}
