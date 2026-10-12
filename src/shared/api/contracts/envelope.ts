import { z } from "zod";

/** Mensagens de validação de um campo; `field` pode ser aninhado (`address.zipCode`). */
export const apiFieldErrorSchema = z.object({
  field: z.string(),
  messages: z.array(z.string()),
});

/** Corpo de `error` no envelope da API (`modulo-auth.md` seção 3). */
export const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
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

export type ApiFieldError = z.infer<typeof apiFieldErrorSchema>;
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
