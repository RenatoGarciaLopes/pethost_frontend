import { isApiError, type FieldIssue } from "./ApiError";
import type { ErrorParams } from "../contracts/envelope";
import { errorCopy } from "./errorCopy";
import type { CopyEntry, CopyInput, ErrorCopyContext } from "./copyTypes";
import { GENERIC_ERROR_MESSAGE, GENERIC_FIELD_MESSAGE } from "./fallbackCopy";

export { GENERIC_ERROR_MESSAGE, GENERIC_FIELD_MESSAGE } from "./fallbackCopy";
export type { ErrorCopyContext } from "./copyTypes";

const catalog: Readonly<Record<string, CopyEntry>> = errorCopy;
const warned = new Set<string>();

/** Em desenvolvimento, avisa uma vez por código sem tradução. Só o código vai ao console: nunca dado pessoal. */
function warnUntranslated(code: string | null): void {
  if (process.env.NODE_ENV === "production") return;
  const key = code ?? "(sem código)";
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[erros] "${key}" não tem tradução em shared/api/errors/copy.`);
}

function resolve(code: string, input: CopyInput): string | undefined {
  const entry = Object.hasOwn(catalog, code) ? catalog[code] : undefined;
  if (entry === undefined) return undefined;
  return typeof entry === "function" ? entry(input) : entry;
}

/**
 * Frase da PetHost para um código conhecido, sem um erro em mãos (ex.: campo travado que a tela já sabe que está
 * travado). Resolve também as frases que dependem do contexto. Código sem tradução cai na frase genérica de topo.
 *
 * @example translateCode("HOST_NOT_FOUND") // "Seus dados ficam editáveis depois da verificação."
 */
export function translateCode(code: string, context: ErrorCopyContext = {}, params: ErrorParams = {}): string {
  return resolve(code, { params, context }) ?? GENERIC_ERROR_MESSAGE;
}

/**
 * Frase da PetHost para qualquer erro, pelo código de topo. É o único lugar que vira erro da API em frase: a tela
 * nunca mostra `error.message`. Código desconhecido cai na frase genérica (e avisa no console em desenvolvimento).
 *
 * @example translateError(error, { role: "owner" })
 */
export function translateError(error: unknown, context: ErrorCopyContext = {}): string {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE;
  const phrase = resolve(error.code, { params: error.params, context, retryAfterSeconds: error.retryAfterSeconds });
  if (phrase === undefined) warnUntranslated(error.code);
  return phrase ?? GENERIC_ERROR_MESSAGE;
}

/**
 * Frase de um motivo de validação de campo, por `code` e `params`. Sem código (API antiga) ou sem tradução cai em
 * "Confere esse campo.", nunca no texto cru da API.
 *
 * @example translateFieldIssue({ code: "PET_NAME_TOO_LONG", params: { max: 80 }, message: "..." }) // "O nome aceita até 80 caracteres."
 */
export function translateFieldIssue(issue: FieldIssue, context: ErrorCopyContext = {}): string {
  const phrase = issue.code === null ? undefined : resolve(issue.code, { params: issue.params, context });
  if (phrase === undefined) warnUntranslated(issue.code);
  return phrase ?? GENERIC_FIELD_MESSAGE;
}

/** Os motivos de um campo numa frase só (sem repetir a mesma frase). */
export function translateFieldIssues(issues: readonly FieldIssue[], context: ErrorCopyContext = {}): string {
  return [...new Set(issues.map((issue) => translateFieldIssue(issue, context)))].join(" ");
}

/**
 * Os campos com erro de um `ApiError`, cada um com sua frase traduzida. Vazio se o erro não é de validação de campo.
 *
 * @example const byField = translateFieldErrors(error); byField.microchip // "Esse microchip já..."
 */
export function translateFieldErrors(error: unknown, context: ErrorCopyContext = {}): Record<string, string> {
  if (!isApiError(error)) return {};
  return Object.fromEntries(
    Object.entries(error.fieldIssues).map(([field, issues]) => [field, translateFieldIssues(issues, context)]),
  );
}
