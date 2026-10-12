import { isApiError } from "./ApiError";
import { errorCopy, GENERIC_ERROR_MESSAGE, type ErrorCopyContext } from "./errorCopy";

/**
 * Frase da PetHost para qualquer erro. A tela nunca mostra `error.message` da API.
 *
 * @example getErrorMessage(error, { role: "owner" })
 */
export function getErrorMessage(error: unknown, context: ErrorCopyContext = {}): string {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE;
  const entry = errorCopy[error.code];
  if (entry === undefined) return GENERIC_ERROR_MESSAGE;
  return typeof entry === "function" ? entry(error, context) : entry;
}
