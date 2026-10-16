import { ApiError, isApiError } from "./ApiError";
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

/**
 * Frase da PetHost para um código conhecido, sem um erro em mãos (ex.: campo travado que a tela já sabe que
 * está travado). Resolve também as frases que dependem do contexto; nunca leia `errorCopy[código]` direto.
 *
 * @example getErrorCopy("HOST_NOT_FOUND") // "Seus dados ficam editáveis depois da verificação."
 */
export function getErrorCopy(code: string, context: ErrorCopyContext = {}): string {
  return getErrorMessage(new ApiError({ status: 0, code, message: code }), context);
}
