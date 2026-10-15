/** Formata valor em reais. Não recebe centavos. @example formatBRL(60) // "R$ 60,00" */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
/** Converte reais para centavos antes de calcular. @example toCents(10.29) // 1029 */
export function toCents(value: number): number {
  return Math.round(value * 100);
}
/** Converte centavos para reais na exibição. @example fromCents(1029) // 10.29 */
export function fromCents(value: number): number {
  return value / 100;
}
