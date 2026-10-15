"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { searchQueries } from "../api/queries";
import type { ListingSummary } from "../api/contracts";
import type { SearchPet, SearchQuery } from "../types";
import { queryToSearchParams, searchParamsToQuery } from "../lib/searchParams";
import { toSearchError, type SearchError } from "../lib/searchErrors";

/** URL é a fonte de filtros; histórico nativo evita refazer o RSC e preserva lista anterior. @example useSearch(accountId, pets, initialQuery, initialError) */
export function useSearch(accountId: string, pets: SearchPet[], initialQuery: SearchQuery, initialError?: SearchError) {
  const params = useSearchParams();
  const query = searchParamsToQuery(new URLSearchParams(params.toString()));
  const [previous, setPrevious] = useState<{ pages: { items: ListingSummary[]; totalCount: number }[] }>();
  const sameInitial = queryToSearchParams(query).toString() === queryToSearchParams(initialQuery).toString();
  const result = useInfiniteQuery({
    ...searchQueries.infinite(accountId, query, pets),
    enabled: !(initialError && sameInitial),
  });
  const data = result.data;
  if (data && !result.isPlaceholderData && data !== previous) setPrevious(data);
  const update = (next: SearchQuery) => {
    window.history.pushState(null, "", `/search?${queryToSearchParams(next)}`);
  };
  return {
    query,
    data: data ?? previous,
    error: result.error ? toSearchError(result.error) : !result.data && sameInitial ? initialError : undefined,
    result,
    update,
  };
}
