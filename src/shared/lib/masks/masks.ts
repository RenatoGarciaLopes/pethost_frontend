/** Strip non-digits and bound input length; presentation only, never document validation. */
function digits(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max);
}
/** Format partial input without trailing punctuation. */
function group(value: string, lengths: readonly number[], separators: readonly string[]): string {
  let offset = 0;
  return lengths
    .map((length, index) => {
      const part = value.slice(offset, offset + length);
      offset += length;
      return part ? `${index ? separators[index - 1] : ""}${part}` : "";
    })
    .join("");
}
/** Unmask CPF (up to 11 digits), without validating check digits. */
export function unmaskCpf(value: string): string {
  return digits(value, 11);
}
/** Posições do CNPJ: as 12 primeiras aceitam letra ou dígito (CNPJ alfanumérico); as 2 últimas, só dígito. */
const CNPJ_BASE_LENGTH = 12;
const CNPJ_LENGTH = 14;
/**
 * Unmask CNPJ, numeric or alphanumeric (spec 030): uppercase letters and digits in the first 12 positions, digits
 * in the 2 check positions; anything else is dropped. Presentation only, never validation.
 */
export function unmaskCnpj(value: string): string {
  let result = "";
  for (const char of value.toUpperCase()) {
    if (result.length === CNPJ_LENGTH) break;
    const allowed = result.length < CNPJ_BASE_LENGTH ? /[0-9A-Z]/ : /\d/;
    if (allowed.test(char)) result += char;
  }
  return result;
}
/** Unmask Brazilian CEP (up to 8 digits). */
export function unmaskCep(value: string): string {
  return digits(value, 8);
}
/** Unmask national Brazilian phone (up to 11 digits); no country code. */
export function unmaskPhone(value: string): string {
  return digits(value, 11);
}
/** Unmask a dd/mm/aaaa date (up to 8 digits), without checking the date exists. */
export function unmaskDate(value: string): string {
  return digits(value, 8);
}
/** Progressive CPF formatting. @example maskCpf("12345678901") */
export function maskCpf(value: string): string {
  return group(unmaskCpf(value), [3, 3, 3, 2], [".", ".", "-"]);
}
/** Progressive CNPJ formatting, numeric or alphanumeric. @example maskCnpj("12abc34501de35") // "12.ABC.345/01DE-35" */
export function maskCnpj(value: string): string {
  return group(unmaskCnpj(value), [2, 3, 3, 4, 2], [".", ".", "/", "-"]);
}
/** Progressive CEP formatting. @example maskCep("12345678") */
export function maskCep(value: string): string {
  return group(unmaskCep(value), [5, 3], ["-"]);
}
/** Progressive phone formatting, landline or mobile. @example maskPhone("11987654321") */
export function maskPhone(value: string): string {
  const raw = unmaskPhone(value);
  if (!raw) return "";
  if (raw.length < 2) return `(${raw}`;
  const area = `(${raw.slice(0, 2)})`;
  if (raw.length === 2) return area;
  return `${area} ${group(raw.slice(2), raw.length > 10 ? [5, 4] : [4, 4], ["-"])}`;
}
/** Progressive date formatting, dd/mm/aaaa. @example maskDate("03051990") // "03/05/1990" */
export function maskDate(value: string): string {
  return group(unmaskDate(value), [2, 2, 4], ["/", "/"]);
}
