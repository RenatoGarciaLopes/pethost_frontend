import { z } from "zod";

/** Valores que a frase de um erro pode citar (limites, formatos); nunca dado pessoal. */
const errorParamsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

/** Um motivo de validação: código estável + parâmetros da frase. */
const apiFieldErrorItemSchema = z.object({
  code: z.string(),
  params: errorParamsSchema.optional(),
});

/**
 * Validação de um campo; `field` pode ser aninhado (`address.zipCode`). `errors[i]` descreve `messages[i]`;
 * a API antiga não manda `errors`.
 */
const apiFieldErrorSchema = z.object({
  field: z.string(),
  messages: z.array(z.string()),
  errors: z.array(apiFieldErrorItemSchema).optional(),
});

/** Corpo de `error` no envelope da API (`modulo-auth.md` seção 3). */
const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  /** Dado que a frase do erro de topo cita (data, petId, limite); nunca dado pessoal. */
  params: errorParamsSchema.optional(),
  details: z.union([z.array(apiFieldErrorSchema), z.object({ traceId: z.string() }).passthrough()]).optional(),
});

/** Envelope de erro: `{ success: false, error, timestamp }`. */
export const apiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: apiErrorBodySchema,
  timestamp: z.string().optional(),
});

/**
 * Envelope de sucesso com `data` validado pelo schema do contrato.
 *
 * @example apiSuccessSchema(userSchema).parse(json).data
 */
export function apiSuccessSchema<TData extends z.ZodTypeAny>(data: TData) {
  return z.object({
    success: z.literal(true),
    data,
    timestamp: z.string().optional(),
  });
}

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
export type ErrorParams = z.infer<typeof errorParamsSchema>;
