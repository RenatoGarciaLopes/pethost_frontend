import { queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { myPetsSchema } from "./contracts";
import { toPetList } from "./mappers";

/** Frescor da lista de pets, igual no servidor e no navegador (sem segundo pedido logo após hidratar). */
const PETS_STALE_TIME = 60_000;

/**
 * Consultas de pets por conta (spec 020). `all` é a raiz: as mutações de 021 e 022 invalidam por ela
 * (REQ-PETS-007). O transporte vem de fora: `bffClient` no navegador, `backendForRequest` no prefetch.
 *
 * @example useQuery(petQueries.mine(user.id))
 * @example await queryClient.prefetchQuery(petQueries.mine(user.id, await backendForRequest()))
 */
export const petQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "pets"),
  mine: (accountId: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: [...petQueries.all(accountId), "mine"] as const,
      queryFn: async () => toPetList(await transport.request({ method: "GET", path: "/pets/me" }, myPetsSchema)),
      staleTime: PETS_STALE_TIME,
    }),
};
