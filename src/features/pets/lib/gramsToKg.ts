/** Converte gramas para kg com três casas; o schema confere o intervalo. @example gramsToKg(35) // 0.035 */
export function gramsToKg(grams: number): number {
  return Math.round(grams) / 1000;
}
