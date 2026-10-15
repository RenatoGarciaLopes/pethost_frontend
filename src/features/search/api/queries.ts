import { infiniteQueryOptions, keepPreviousData } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { SearchPet, SearchQuery } from "../types";
import { toApiSearch } from "../lib/searchParams";
import { searchPageSchema } from "./contracts";

/** Consultas isoladas por conta; servidor e navegador usam a mesma chave e contrato. @example useInfiniteQuery(searchQueries.infinite(accountId, query, pets)) */
export const searchQueries = {
  infinite: (
    accountId: string,
    query: SearchQuery,
    pets: SearchPet[],
    transport: Pick<HttpTransport, "request"> = bffClient,
  ) =>
    infiniteQueryOptions({
      queryKey: accountQueryKey(accountId, "search", toApiSearch(query, pets, 1)),
      initialPageParam: 1,
      queryFn: ({ pageParam, signal }) =>
        transport.request(
          { method: "GET", path: "/listings", query: toApiSearch(query, pets, pageParam), signal },
          searchPageSchema,
        ),
      getNextPageParam: (last) => (last.page * last.pageSize < last.totalCount ? last.page + 1 : undefined),
      staleTime: 60_000,
      placeholderData: keepPreviousData,
      retry: false,
    }),
};
