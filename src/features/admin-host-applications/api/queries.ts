import { queryOptions } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { ApplicationStatus } from "./contracts";
import { getApplication, listApplications } from "./client/adminApplications.client";
/** Consultas administrativas isoladas por conta. Links de fotos não participam desta cache hidratada.
 * @example useQuery(adminApplicationQueries.queue(accountId, "submitted"))
 */
export const adminApplicationQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "admin", "host-applications"),
  queue: (accountId: string, status: ApplicationStatus, transport?: HttpTransport) =>
    queryOptions({
      queryKey: [...adminApplicationQueries.all(accountId), "queue", status],
      queryFn: ({ signal }) => listApplications(status, transport, signal),
      staleTime: 30_000,
    }),
  detail: (accountId: string, id: string, transport?: HttpTransport) =>
    queryOptions({
      queryKey: [...adminApplicationQueries.all(accountId), "detail", id],
      queryFn: ({ signal }) => getApplication(id, transport, signal),
      staleTime: 30_000,
    }),
};
