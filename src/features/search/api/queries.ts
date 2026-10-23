import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { Coordinates } from "@/shared/hooks/useGeolocation";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { SearchPet, SearchQuery } from "../types";
import { toApiSearch } from "../lib/searchParams";
import { searchPageSchema } from "./contracts";

/** Raio e tamanho da vitrine "perto de você" da home. */
export const NEARBY_RADIUS_KM = 10;
export const NEARBY_PAGE_SIZE = 6;

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
  /**
   * Cantinhos perto de um ponto, para a home. `scope` separa quem vê (`visitor` ou o id da conta), porque os selos
   * (como "Vizinho") dependem da conta. A coordenada vai só na chamada ao servidor.
   * @example useQuery(searchQueries.nearby("visitor", { latitude: -23.43, longitude: -51.94 }))
   */
  nearby: (scope: string, coords: Coordinates, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: ["search", "nearby", scope, coords.latitude, coords.longitude] as const,
      queryFn: ({ signal }) =>
        transport.request(
          {
            method: "GET",
            path: "/listings",
            query: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              radiusKm: NEARBY_RADIUS_KM,
              pageSize: NEARBY_PAGE_SIZE,
            },
            signal,
          },
          searchPageSchema,
        ),
      staleTime: 60_000,
      retry: false,
    }),
  /**
   * Cantinhos sem filtro de lugar, a reserva da vitrine da home quando o raio vem vazio ou não há posição. Para o
   * visitante a API lista todos, do mais novo ao mais antigo; para quem está logado, sem lugar ela busca em volta do
   * endereço da conta (e responde 422 se a conta não tiver endereço).
   * @example useQuery(searchQueries.all("visitor"))
   */
  all: (scope: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: ["search", "all", scope] as const,
      queryFn: ({ signal }) =>
        transport.request(
          { method: "GET", path: "/listings", query: { pageSize: NEARBY_PAGE_SIZE }, signal },
          searchPageSchema,
        ),
      staleTime: 60_000,
      retry: false,
    }),
};
