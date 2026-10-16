import { queryOptions } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { getOwner, listOwners } from "./client/adminOwners.client";
/** Cache administrativo de tutores isolado por conta; busca pessoal nunca entra na chave.
 * @example useQuery(adminOwnerQueries.list(adminId))
 */
export const adminOwnerQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "admin", "owners"),
  lists: (accountId: string) => [...adminOwnerQueries.all(accountId), "list"],
  list: (accountId: string, transport?: HttpTransport) =>
    queryOptions({
      queryKey: adminOwnerQueries.lists(accountId),
      queryFn: ({ signal }) => listOwners(transport, signal),
      staleTime: 30_000,
    }),
  detail: (accountId: string, id: string, transport?: HttpTransport) =>
    queryOptions({
      queryKey: [...adminOwnerQueries.all(accountId), "detail", id],
      queryFn: ({ signal }) => getOwner(id, transport, signal),
      staleTime: 30_000,
    }),
};
