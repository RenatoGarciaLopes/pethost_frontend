/** Forma dos `searchParams` que o App Router entrega às páginas. */
export type SearchParams = Record<string, string | string[] | undefined>;

/** Primeiro valor de um parâmetro que pode vir repetido (`?next=a&next=b` → `a`). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
