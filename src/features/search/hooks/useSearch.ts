"use client";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { searchQueries } from "../api/queries";
import type { ListingSummary } from "../api/contracts";
import type { SearchPet, SearchQuery } from "../types";
import { queryToSearchParams } from "../lib/searchParams";
import { useSearchUrl } from "./useSearchUrl";
import { toSearchError, type SearchError } from "../lib/searchErrors";

/** Resultados da busca da home: a URL é a fonte de filtros e a lista anterior fica na tela durante a atualização. @example useSearch(accountId, pets, initialQuery, initialError) */
export function useSearch(accountId: string, pets: SearchPet[], initialQuery: SearchQuery, initialError?: SearchError) {
  const { query, update } = useSearchUrl();
  const [previous, setPrevious] = useState<{ pages: { items: ListingSummary[]; totalCount: number }[] }>();
  const sameInitial = queryToSearchParams(query).toString() === queryToSearchParams(initialQuery).toString();
  const result = useInfiniteQuery({
    ...searchQueries.infinite(accountId, query, pets),
    enabled: !(initialError && sameInitial),
  });
  const data = result.data;
  if (data && !result.isPlaceholderData && data !== previous) setPrevious(data);
  return {
    query,
    data: data ?? previous,
    error: result.error ? toSearchError(result.error) : !result.data && sameInitial ? initialError : undefined,
    result,
    update,
  };
}
