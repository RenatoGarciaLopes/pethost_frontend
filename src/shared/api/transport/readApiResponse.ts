import type { z } from "zod";
import { apiErrorEnvelopeSchema, apiSuccessSchema } from "../contracts/envelope";
import { ApiError } from "../errors/ApiError";

/**
 * Lê uma `Response` da API (ou do BFF) pelo envelope e valida `data` com o schema.
 * Usado pelo transporte do servidor e pelo do navegador: um só lugar decide o formato.
 *
 * @throws {ApiError} erro do envelope, status sem envelope (`UNEXPECTED_ERROR`) ou `CONTRACT_MISMATCH`.
 */
export async function readApiResponse<TSchema extends z.ZodTypeAny>(
  response: Response,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = apiErrorEnvelopeSchema.safeParse(body);
    const retryAfterSeconds = ApiError.parseRetryAfter(response.headers.get("retry-after"));
    if (parsedError.success) {
      return Promise.reject(ApiError.fromEnvelope(response.status, parsedError.data.error, { retryAfterSeconds }));
    }
    return Promise.reject(
      new ApiError({
        status: response.status,
        code: "UNEXPECTED_ERROR",
        message: `HTTP ${response.status}`,
        retryAfterSeconds,
      }),
    );
  }

  if (response.status === 204 || body === EMPTY) {
    const parsedEmpty = schema.safeParse(undefined);
    if (parsedEmpty.success) return parsedEmpty.data;
  }

  if (body === INVALID_JSON || body === EMPTY) {
    throw ApiError.contractMismatch(response.status, ["(body)"]);
  }

  const parsed = apiSuccessSchema(schema).safeParse(body);
  if (!parsed.success) {
    throw ApiError.contractMismatch(
      response.status,
      parsed.error.issues.map((issue) => issue.path.join(".") || "(root)"),
    );
  }
  return parsed.data.data;
}

const EMPTY = Symbol("empty");
const INVALID_JSON = Symbol("invalid-json");

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return EMPTY;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return INVALID_JSON;
  }
}
