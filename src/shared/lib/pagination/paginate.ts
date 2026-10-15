/** Paginação imutável no cliente; página fora do intervalo é limitada. Não pagina a API.
 * Lista vazia tem uma página vazia; página não inteira volta a 1. pageSize inválido lança RangeError.
 * @example paginate([1, 2, 3], 2, 2) // { items: [3], page: 2, pages: 2, total: 3 }
 */
export function paginate<T>(items: readonly T[], requestedPage: number, pageSize: number) {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new RangeError("pageSize must be a positive integer");
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pages, total: items.length };
}
