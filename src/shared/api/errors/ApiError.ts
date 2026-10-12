import type { ApiErrorBody } from "../contracts/envelope";

/** Mapa campo → mensagens, com o caminho da API preservado (`address.zipCode`). */
export type FieldErrors = Record<string, string[]>;

/**
 * Marca global do `ApiError`. `Symbol.for` é o mesmo em todas as cópias do módulo
 * (em desenvolvimento o Next pode carregar este arquivo em mais de um pacote, e aí `instanceof` falha).
 */
const API_ERROR_BRAND = Symbol.for("pethost.ApiError");

interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
  retryAfterSeconds?: number;
  traceId?: string;
  invalidPaths?: string[];
  cause?: unknown;
}

/**
 * Erro único de toda chamada HTTP do app (API, BFF ou transporte).
 * A tela nunca lê `message` direto: usa `getErrorMessage(error)`.
 */
export class ApiError extends Error {
  override readonly name = "ApiError";
  /** Status HTTP; 0 quando a rede falhou. */
  readonly status: number;
  /** Código da API (`AUTH_INVALID_CREDENTIALS`) ou local (`NETWORK_ERROR`). */
  readonly code: string;
  readonly fieldErrors: FieldErrors;
  /** Segundos do cabeçalho `Retry-After` (429). */
  readonly retryAfterSeconds?: number;
  /** Identificador do erro 500 para o suporte. */
  readonly traceId?: string;
  /** Caminhos que não bateram com o contrato (só em `CONTRACT_MISMATCH`). */
  readonly invalidPaths: string[];

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause });
    Object.defineProperty(this, API_ERROR_BRAND, { value: true });
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? {};
    this.retryAfterSeconds = init.retryAfterSeconds;
    this.traceId = init.traceId;
    this.invalidPaths = init.invalidPaths ?? [];
  }

  /** Cria a partir do `error` do envelope da API. */
  static fromEnvelope(status: number, body: ApiErrorBody, extra: { retryAfterSeconds?: number } = {}): ApiError {
    const details = body.details;
    const fieldErrors: FieldErrors = {};
    let traceId: string | undefined;

    if (Array.isArray(details)) {
      for (const { field, messages } of details) {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), ...messages];
      }
    } else if (details) {
      traceId = details.traceId;
    }

    return new ApiError({
      status,
      code: body.code,
      message: body.message,
      fieldErrors,
      traceId,
      retryAfterSeconds: extra.retryAfterSeconds,
    });
  }

  /** Rede caída, CORS ou tempo limite. */
  static networkError(cause: unknown): ApiError {
    return new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Network request failed", cause });
  }

  /** A resposta não bate com o schema: registra só os caminhos, nunca o corpo. */
  static contractMismatch(status: number, invalidPaths: string[]): ApiError {
    return new ApiError({
      status,
      code: "CONTRACT_MISMATCH",
      message: `Response does not match the contract at: ${invalidPaths.join(", ")}`,
      invalidPaths,
    });
  }

  /**
   * Lê `Retry-After` em segundos ou data HTTP.
   * @returns segundos inteiros (mínimo 0) ou `undefined` se ausente ou inválido.
   */
  static parseRetryAfter(value: string | null | undefined, now: number = Date.now()): number | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    // HTTP-date (RFC 9110) sempre termina em "GMT"; evita que Date.parse aceite "-3".
    if (!trimmed.endsWith("GMT")) return undefined;
    const date = Date.parse(trimmed);
    if (Number.isNaN(date)) return undefined;
    return Math.max(0, Math.ceil((date - now) / 1000));
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      code: this.code,
      message: this.message,
      fieldErrors: this.fieldErrors,
      retryAfterSeconds: this.retryAfterSeconds,
      traceId: this.traceId,
      invalidPaths: this.invalidPaths,
    };
  }
}

export function isApiError(value: unknown): value is ApiError {
  return (
    value instanceof ApiError ||
    (typeof value === "object" && value !== null && (value as Record<symbol, unknown>)[API_ERROR_BRAND] === true)
  );
}

/** `true` quando `value` é um `ApiError` com o código informado. */
export function hasErrorCode(value: unknown, code: string): value is ApiError {
  return isApiError(value) && value.code === code;
}
