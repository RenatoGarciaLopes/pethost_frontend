/** Tamanho mínimo da senha forte (Auth.Domain.Users.Password). */
const PASSWORD_MIN = 8;
/** Tamanho máximo da senha forte, em unidades UTF-16 como no .NET. */
export const PASSWORD_MAX = 128;

/** As cinco regras da senha forte da API. */
export type PasswordRule = "length" | "uppercase" | "lowercase" | "digit" | "special";

/**
 * Regras da senha forte, uma função por regra (fonte única para o Zod e para o `PasswordStrengthChecklist`).
 * Espaço não conta como símbolo. Só para senha **nova**: o login não confere força.
 *
 * @example PASSWORD_RULES.digit("abc1") // true
 */
export const PASSWORD_RULES: Readonly<Record<PasswordRule, (password: string) => boolean>> = {
  length: (password) => password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
  uppercase: (password) => /\p{Lu}/u.test(password),
  lowercase: (password) => /\p{Ll}/u.test(password),
  digit: (password) => /\p{Nd}/u.test(password),
  special: (password) => /[^\p{L}\p{Nd}\s]/u.test(password),
};

/** A senha cumpre as cinco regras? @example isStrongPassword("Abcdef1!") // true */
export function isStrongPassword(password: string): boolean {
  return Object.values(PASSWORD_RULES).every((rule) => rule(password));
}
