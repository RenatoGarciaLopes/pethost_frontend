import { z } from "zod";

/**
 * Data de rotas sem retorno, como logout e recuperação de senha; aceita campos adicionais e ausência.
 * @example emptyDataSchema.parse({})
 */
export const emptyDataSchema = z.object({}).passthrough().optional();
