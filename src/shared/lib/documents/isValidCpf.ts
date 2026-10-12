/** Dígito verificador do CPF (módulo 11) para os primeiros `length` dígitos. */
function checkDigit(digits: string, length: number): number {
  let sum = 0;
  for (let index = 0; index < length; index++) sum += Number(digits[index]) * (length + 1 - index);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

/**
 * Confere o CPF pelos dois dígitos verificadores. Aceita com ou sem máscara;
 * recusa tamanho diferente de 11 dígitos e números repetidos (`111.111.111-11`).
 * Só valida a forma: a API continua sendo a fonte (CPF já usado vem como 409).
 *
 * @example isValidCpf("529.982.247-25") // true
 */
export function isValidCpf(value: string): boolean {
  if (/[^\d.\-\s]/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  return checkDigit(digits, 9) === Number(digits[9]) && checkDigit(digits, 10) === Number(digits[10]);
}
