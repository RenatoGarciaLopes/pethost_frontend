import { z } from "zod";

type Unwrapped<T> =
  T extends z.ZodOptional<infer TInner>
    ? Unwrapped<TInner>
    : T extends z.ZodNullable<infer TInner>
      ? Unwrapped<TInner>
      : T extends z.ZodUnion<infer TOptions>
        ? Exclude<TOptions[number], z.ZodNull>
        : T;

/**
 * Tira o schema de `data` de uma resposta gerada pelo Orval (`XxxResponse`), que vem
 * como envelope inteiro com `data` opcional e `union([null, T])`. O envelope em si é lido por `readApiResponse`.
 *
 * @example const userSchema = unwrapData(GetApiV1UsersMeResponse);
 */
export function unwrapData<TData extends z.ZodTypeAny>(response: z.ZodObject<{ data: TData }>): Unwrapped<TData> {
  return unwrapNullish(response.shape.data) as Unwrapped<TData>;
}

function unwrapNullish(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) return unwrapNullish(schema.unwrap());
  if (schema instanceof z.ZodUnion) {
    const options = (schema.options as z.ZodTypeAny[]).filter((option) => !(option instanceof z.ZodNull));
    return options.length === 1 ? options[0]! : z.union(options as [z.ZodTypeAny, z.ZodTypeAny]);
  }
  return schema;
}
