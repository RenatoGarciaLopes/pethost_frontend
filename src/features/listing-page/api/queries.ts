import { queryOptions } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { listingDetailSchema } from "./contracts";

/** Consultas privadas do detalhe, isoladas por conta. @example listingPageQueries.detail(accountId, listingId) */
export const listingPageQueries = {
  detail: (accountId: string, listingId: string, transport: Pick<HttpTransport, "request"> = bffClient) =>
    queryOptions({
      queryKey: accountQueryKey(accountId, "listing-page", listingId),
      queryFn: ({ signal }) =>
        transport.request({ method: "GET", path: `/listings/${listingId}`, signal }, listingDetailSchema),
      retry: false,
    }),
};
