/**
 * Iniciais do primeiro e do último nome, em maiúscula, para a foto que falta (specs 015 e 021).
 * Nome vazio vira "?", para o círculo nunca ficar em branco.
 * @example initialsOf("Ana Maria Lima") // "AL"
 */
export function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return [words[0]?.[0], words.length > 1 ? words.at(-1)?.[0] : ""].join("").toLocaleUpperCase("pt-BR") || "?";
}
