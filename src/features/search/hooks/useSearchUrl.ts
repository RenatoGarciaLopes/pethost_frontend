"use client";
import { useSearchParams } from "next/navigation";
import type { SearchQuery } from "../types";
import { queryToSearchParams, searchParamsToQuery } from "../lib/searchParams";

/** Endereço da home com a busca na URL; busca vazia é a própria `/`. @example searchHref({ ...query, where: "Zona 7" }) // "/?where=Zona+7" */
export function searchHref(query: SearchQuery): string {
  const params = queryToSearchParams(query);
  return params.size ? `/?${params}` : "/";
}

/**
 * A busca vive na URL da home: lê os filtros dela e escreve o próximo estado pelo histórico nativo, sem refazer o RSC.
 * @example const { query, update } = useSearchUrl();
 */
export function useSearchUrl() {
  const params = useSearchParams();
  const query = searchParamsToQuery(new URLSearchParams(params.toString()));
  const update = (next: SearchQuery) => {
    window.history.pushState(null, "", searchHref(next));
  };
  return { query, update };
}
