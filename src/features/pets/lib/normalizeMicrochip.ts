/** Retira espaços e hífens; só devolve identificadores de quinze dígitos. @example normalizeMicrochip("123 456-789012345") // "123456789012345" */
export function normalizeMicrochip(text: string): string | null {
  const value = text.replace(/[\s-]/g, "");
  return /^\d{15}$/.test(value) ? value : null;
}
