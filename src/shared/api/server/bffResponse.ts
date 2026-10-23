import "server-only";
import { NextResponse } from "next/server";
import type { ApiErrorBody } from "../contracts/envelope";
import { ApiError, isApiError, type FieldIssue } from "../errors/ApiError";

/** Resposta de sucesso do BFF no mesmo envelope da API. */
export function bffSuccessResponse<TData>(data: TData, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() }, { status });
}

/**
 * Resposta de erro do BFF no envelope da API. Erro da API passa igual (status, details, Retry-After);
 * falha de rede ou de contrato com a API vira 502 sem detalhes internos; o resto vira 500 genérico.
 */
export function bffErrorResponse(error: unknown): NextResponse {
  const { status, body, retryAfterSeconds } = toEnvelopeError(error);
  const response = NextResponse.json({ success: false, error: body, timestamp: new Date().toISOString() }, { status });
  if (retryAfterSeconds !== undefined) response.headers.set("retry-after", String(retryAfterSeconds));
  return response;
}

/** Atalho para os erros do próprio BFF (`SESSION_EXPIRED`, `CSRF_REJECTED`, `ROUTE_NOT_ALLOWED`). */
export function bffLocalError(status: number, code: string, message: string): NextResponse {
  return bffErrorResponse(new ApiError({ status, code, message }));
}

/** Devolve ao navegador o campo como a API mandou; `errors` só vai quando todos os motivos têm código. */
function toFieldDetail(field: string, issues: FieldIssue[]) {
  const messages = issues.map((issue) => issue.message);
  const coded = issues.every((issue) => issue.code !== null);
  return coded
    ? { field, messages, errors: issues.map(({ code, params }) => ({ code: code as string, params })) }
    : { field, messages };
}

function toEnvelopeError(error: unknown): { status: number; body: ApiErrorBody; retryAfterSeconds?: number } {
  if (!isApiError(error)) {
    return { status: 500, body: { code: "UNEXPECTED_ERROR", message: "An unexpected error occurred." } };
  }
  if (error.code === "NETWORK_ERROR") {
    return { status: 502, body: { code: "UPSTREAM_UNAVAILABLE", message: "Upstream unavailable" } };
  }
  if (error.code === "CONTRACT_MISMATCH") {
    return { status: 502, body: { code: "CONTRACT_MISMATCH", message: "Upstream contract mismatch" } };
  }

  const fields = Object.entries(error.fieldIssues);
  const details =
    fields.length > 0
      ? fields.map(([field, issues]) => toFieldDetail(field, issues))
      : error.traceId
        ? { traceId: error.traceId }
        : undefined;

  return {
    status: error.status,
    body: { code: error.code, message: error.message, ...(details ? { details } : {}) },
    retryAfterSeconds: error.retryAfterSeconds,
  };
}
