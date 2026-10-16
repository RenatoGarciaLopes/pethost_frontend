import { queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { myApplicationSchema } from "./contracts";
import { toMyApplication } from "./toMyApplication";

/**
 * "Minha verificação" por conta (spec 030). Em análise, volta a ler quando a pessoa volta para a aba: a decisão pode
 * ter chegado. O transporte vem de fora: `bffClient` no navegador, `backendForRequest` no prefetch. Nenhuma foto ou
 * CPF vai na chave.
 *
 * @example useQuery(myApplicationQueries.mine(user.id))
 * @example await queryClient.prefetchQuery(myApplicationQueries.mine(user.id, await backendForRequest()))
 */
export const myApplicationQueries = {
  mine: (accountId: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: accountQueryKey(accountId, "host-application", "me"),
      queryFn: async () =>
        toMyApplication(await transport.request({ method: "GET", path: "/hosts/me/application" }, myApplicationSchema)),
      refetchOnWindowFocus: (query) => query.state.data?.application?.status === "submitted",
    }),
};
