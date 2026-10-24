import type { ApiErrorBody, ErrorParams } from "../contracts/envelope";

/**
 * Um motivo de validação de um campo. `code` é o código estável da API (`null` quando a API não mandou: versão antiga).
 * `message` é o texto cru da API, só para repassar e registrar: a tela traduz `code` + `params` com `translateFieldIssue`.
 */
export interface FieldIssue {
  code: string | null;
  params: ErrorParams;
  message: string;
}

/** Mapa campo → motivos, com o caminho da API preservado (`address.zipCode`). */
export type FieldIssues = Record<string, FieldIssue[]>;

/**
 * Marca global do `ApiError`. `Symbol.for` é o mesmo em todas as cópias do módulo
 * (em desenvolvimento o Next pode carregar este arquivo em mais de um pacote, e aí `instanceof` falha).
 */
const API_ERROR_BRAND = Symbol.for("pethost.ApiError");

interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  fieldIssues?: FieldIssues;
  params?: ErrorParams;
  retryAfterSeconds?: number;
  traceId?: string;
  invalidPaths?: string[];
  cause?: unknown;
}

/**
 * Erro único de toda chamada HTTP do app (API, BFF ou transporte).
 * A tela nunca lê `message` direto: usa `translateError(error)`.
 */
export class ApiError extends Error {
  override readonly name = "ApiError";
  /** Status HTTP; 0 quando a rede falhou. */
  readonly status: number;
  /** Código da API (`AUTH_INVALID_CREDENTIALS`) ou local (`NETWORK_ERROR`). */
  readonly code: string;
  readonly fieldIssues: FieldIssues;
  /** Dado que a frase do erro de topo cita (`date`, `petId`, `max`...). */
  readonly params: ErrorParams;
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
    this.fieldIssues = init.fieldIssues ?? {};
    this.params = init.params ?? {};
    this.retryAfterSeconds = init.retryAfterSeconds;
    this.traceId = init.traceId;
    this.invalidPaths = init.invalidPaths ?? [];
  }

  /** Cria a partir do `error` do envelope da API. */
  static fromEnvelope(status: number, body: ApiErrorBody, extra: { retryAfterSeconds?: number } = {}): ApiError {
    const details = body.details;
    const fieldIssues: FieldIssues = {};
    let traceId: string | undefined;

    if (Array.isArray(details)) {
      for (const { field, messages, errors } of details) {
        // `errors[i]` descreve `messages[i]`; se o tamanho não bate, o contrato não vale e nenhum código é usado.
        const coded = errors?.length === messages.length ? errors : undefined;
        const issues = messages.map((message, index) => ({
          code: coded?.[index].code ?? null,
          params: coded?.[index].params ?? {},
          message,
        }));
        fieldIssues[field] = [...(fieldIssues[field] ?? []), ...issues];
      }
    } else if (details) {
      traceId = details.traceId;
    }

    return new ApiError({
      status,
      code: body.code,
      message: body.message,
      fieldIssues,
      params: body.params,
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
      fieldIssues: this.fieldIssues,
      params: this.params,
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
