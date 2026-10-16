/** Normaliza texto para busca local sem acentos ou caixa; não é máscara de documento nem slug.
 * Não persista o texto de buscas que possam conter dados pessoais.
 * @example filterText(" João ") // "joao"
 */
export function filterText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
