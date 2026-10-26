"use client";
import { useSearchParams } from "next/navigation";
import type { SearchQuery } from "../types";
import { searchHref, searchParamsToQuery } from "../lib/searchParams";

/**
 * A busca vive na URL da home: lê os filtros dela e escreve o próximo estado pelo histórico nativo, sem refazer o RSC.
 * @example const { query, update } = useSearchUrl();
 */
export function useSearchUrl() {
  const params = useSearchParams();
  const query = searchParamsToQuery(new URLSearchParams(params.toString()));
  const update = (next: SearchQuery) => {
    window.history.pushState(null, "", searchHref(next));
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  return { query, update };
}
