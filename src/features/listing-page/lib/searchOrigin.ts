/**
 * Único ponto que sabe onde ficam os resultados da busca. A home vira a página de resultados (a rota /search sai,
 * tarefa 079): o "voltar" do cantinho leva à home com os parâmetros da busca de origem. Se o destino mudar, muda só
 * aqui.
 * @example searchOriginHref("where=Maring%C3%A1&from=2026-12-20") // "/?where=Maring%C3%A1&from=2026-12-20"
 */
export function searchOriginHref(search: string): string {
  return search ? `/?${search}` : "/";
}
