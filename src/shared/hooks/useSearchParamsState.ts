"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { z } from "zod";
/** Estado público plano (texto, número ou booleano) validado na URL, preservando filtros alheios.
 * Parâmetros repetidos chegam ao schema como arrays, igual aos searchParams do servidor Next.
 * Nunca passe segredos ou dados pessoais.
 * O schema define padrões/erros; update valida e usa router.push sem scroll, preservando parâmetros alheios.
 * @example const [filters, setFilters] = useSearchParamsState(queueSearchSchema); setFilters({ page: 2 });
 */
export function useSearchParamsState<T extends Record<string, string | number | boolean | null | undefined>>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const entries = params.getAll(key);
    values[key] = entries.length === 1 ? entries[0] : entries;
  }
  const state = schema.parse(values);
  function update(patch: Partial<T>) {
    const next = schema.parse({ ...state, ...patch });
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === null) query.delete(key);
    }
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === null) query.delete(key);
      else query.set(key, String(value));
    }
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  }
  return [state, update] as const;
}
