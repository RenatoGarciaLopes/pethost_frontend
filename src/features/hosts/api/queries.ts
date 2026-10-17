import { queryOptions } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { StripeStatus } from "./contracts";
import { getHost, listHosts } from "./client/adminHosts.client";
/** Cache administrativo por conta e filtro Stripe. Invalidar lists cobre todos os seis filtros.
 * @example useQuery(adminHostQueries.list(adminId, "rejected"))
 */
export const adminHostQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "admin", "hosts"),
  lists: (accountId: string) => [...adminHostQueries.all(accountId), "list"],
  list: (accountId: string, stripeStatus?: StripeStatus, transport?: HttpTransport) =>
    queryOptions({
      queryKey: [...adminHostQueries.lists(accountId), stripeStatus ?? "all"],
      queryFn: ({ signal }) => listHosts(stripeStatus, transport, signal),
      staleTime: 30_000,
    }),
  detail: (accountId: string, id: string, transport?: HttpTransport) =>
    queryOptions({
      queryKey: [...adminHostQueries.all(accountId), "detail", id],
      queryFn: ({ signal }) => getHost(id, transport, signal),
      staleTime: 30_000,
    }),
};
