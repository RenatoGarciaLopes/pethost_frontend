const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Reais no padrão brasileiro ("R$ 1.080,00"). Recebe reais (como a API manda a diária), não centavos.
 * @example formatBRL(fromCents(108000)) // "R$ 1.080,00"
 */
export function formatBRL(value: number): string {
  return brl.format(value);
}

/**
 * Reais → centavos inteiros (conta de dinheiro sempre em centavos, conventions §4).
 * @example toCents(19.99) // 1999
 */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Centavos inteiros → reais (para a API, que recebe a diária em reais com 2 casas, e para `formatBRL`).
 * @example fromCents(1999) // 19.99
 */
export function fromCents(cents: number): number {
  return cents / 100;
}
