import { queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { hostPetsSchema, myPetsSchema, petDtoSchema } from "./contracts";
import { toPetDetail } from "./toPetDetail";
import { toHouseResidents, toPetList } from "./mappers";

/** Frescor da lista de pets, igual no servidor e no navegador (sem segundo pedido logo após hidratar). */
const PETS_STALE_TIME = 60_000;

/**
 * Consultas de pets por conta (specs 020/022). `all` é a raiz; após salvar o detalhe inteiro,
 * as mutações invalidam apenas `mine`. O transporte vem de fora: `bffClient` no navegador,
 * `backendForRequest` no prefetch.
 *
 * @example useQuery(petQueries.mine(user.id))
 * @example useQuery(petQueries.detail(user.id, petId))
 * @example await queryClient.prefetchQuery(petQueries.mine(user.id, await backendForRequest()))
 */
export const petQueries = {
  /** Vitrine autenticada com projeção pública igual entre contas. @example useQuery(petQueries.house(hostProfileId)) */
  house: (hostId: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: ["public", "host-pets", hostId] as const,
      queryFn: async () =>
        toHouseResidents(
          await transport.request({ method: "GET", path: `/hosts/${encodeURIComponent(hostId)}/pets` }, hostPetsSchema),
        ),
      staleTime: PETS_STALE_TIME,
      retry: false,
    }),
  all: (accountId: string) => accountQueryKey(accountId, "pets"),
  detail: (accountId: string, petId: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: [...petQueries.all(accountId), "detail", petId] as const,
      queryFn: async () =>
        toPetDetail(
          await transport.request({ method: "GET", path: `/pets/${encodeURIComponent(petId)}` }, petDtoSchema),
        ),
      staleTime: PETS_STALE_TIME,
    }),
  mine: (accountId: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: [...petQueries.all(accountId), "mine"] as const,
      queryFn: async () => toPetList(await transport.request({ method: "GET", path: "/pets/me" }, myPetsSchema)),
      staleTime: PETS_STALE_TIME,
    }),
};
