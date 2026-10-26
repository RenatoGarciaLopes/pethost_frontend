const BASE_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CHECK_WEIGHTS = [6, ...BASE_WEIGHTS];

/** Valor de cada posição no cálculo da Receita: o código ASCII menos 48 (dígito vale ele mesmo; "A" vale 17). */
const valueOf = (char: string) => char.charCodeAt(0) - 48;

/** Dígito verificador (módulo 11) dos caracteres dados, com os pesos da posição. */
function checkDigit(chars: string, weights: readonly number[]): number {
  const sum = [...chars].reduce((total, char, index) => total + valueOf(char) * weights[index]!, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

/**
 * Confere o CNPJ pelos dois dígitos verificadores, numérico ou alfanumérico (Receita, a partir de 2026: letras e
 * dígitos nas 12 primeiras posições, dígitos nas 2 últimas). Aceita com ou sem máscara e letras minúsculas; recusa
 * tamanho errado e tudo igual. Só valida a forma: CNPJ já usado vem da API como 409.
 *
 * @example isValidCnpj("11.222.333/0001-81") // true
 * @example isValidCnpj("12.ABC.345/01DE-35") // true
 */
export function isValidCnpj(value: string): boolean {
  if (/[^0-9A-Za-z.\-/\s]/.test(value)) return false;
  const chars = value.replace(/[.\-/\s]/g, "").toUpperCase();
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || /^(.)\1{13}$/.test(chars)) return false;
  const first = checkDigit(chars.slice(0, 12), BASE_WEIGHTS);
  const second = checkDigit(chars.slice(0, 12) + first, CHECK_WEIGHTS);
  return chars.endsWith(`${first}${second}`);
}
