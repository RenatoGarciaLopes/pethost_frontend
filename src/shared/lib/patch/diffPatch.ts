const normalize = (value: unknown): unknown => (typeof value === "string" ? value.trim() : value);

/**
 * Calcula um PATCH raso, sem mutar entradas; ausências comuns não alteram a API.
 * Use clearable para textos apagáveis (vazio ou ausente vira `""`, que a API entende como limpar) e equals para
 * valores compostos; não faz diff profundo. Fora de clearable, ausente não vai, mas `""` digitado vai como `""`:
 * campo obrigatório esvaziado chega à API para ser recusado, em vez de sumir calado do PATCH.
 * @example diffPatch({ notes: "Texto" }, { notes: "" }, { clearable: ["notes"] }) // { notes: "" }
 */
export function diffPatch<T extends Record<string, unknown>>(
  original: T,
  edited: T,
  options?: { clearable?: readonly (keyof T)[]; equals?: (a: unknown, b: unknown) => boolean },
): Partial<Record<keyof T, unknown>> {
  const patch: Partial<Record<keyof T, unknown>> = {};
  const keys = new Set([...Object.keys(original), ...Object.keys(edited)] as (keyof T)[]);
  const equals = options?.equals ?? Object.is;
  for (const key of keys) {
    const before = normalize(original[key]);
    const after = normalize(edited[key]);
    if (after === undefined || after === "") {
      if (options?.clearable?.includes(key) && before !== undefined && before !== "") patch[key] = "";
      else if (after === "" && !equals(before, after) && !options?.clearable?.includes(key)) patch[key] = "";
      continue;
    }
    if (!equals(before, after)) patch[key] = after;
  }
  return patch;
}
