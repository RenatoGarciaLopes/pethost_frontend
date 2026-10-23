import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { isApiError } from "./ApiError";
import { translateFieldIssues, type ErrorCopyContext } from "./translateError";

export interface ApplyFieldErrorsOptions<TValues extends FieldValues> {
  /**
   * Campos que o formulário mostra. O que vier da API fora desta lista vai para `root.server`,
   * para a mensagem não sumir. Sem a lista, todo campo é aplicado como veio.
   */
  fields?: readonly FieldPath<TValues>[];
  /** Nome do campo da API → nome no formulário, quando diferem. */
  rename?: (field: string) => string;
  context?: ErrorCopyContext;
}

/**
 * Leva os motivos de campo de um `ApiError` (400 `VALIDATION_ERROR`) aos campos do React Hook Form, já traduzidos
 * por `translateFieldIssues` (nunca o texto da API), inclusive os aninhados (`address.zipCode`), e foca o primeiro
 * campo com erro. O que não é de campo nenhum vai, traduzido, para `root.server`.
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

  for (const [apiField, issues] of Object.entries(error.fieldIssues)) {
    const field = options.rename?.(apiField) ?? apiField;
    const message = translateFieldIssues(issues, options.context);
    if (known && !known.has(field)) {
      orphanMessages.push(message);
      continue;
    }
    const name = field as FieldPath<TValues>;
    setError(name, { type: "server", message }, { shouldFocus: applied.length === 0 });
    applied.push(name);
  }

  if (orphanMessages.length > 0) {
    setError("root.server", { type: "server", message: [...new Set(orphanMessages)].join(" ") });
  }

  return applied;
}
