import { queryOptions } from "@tanstack/react-query";
import { adminAuditQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { AuditQuery } from "../lib/toAuditQuery";
import { listAuditEntries } from "./client/audit.client";

/** Consulta privada separada por admin e parâmetros da busca.
 * @example useQuery(auditQueries.page(adminId, query))
 */
export const auditQueries = {
  all: (adminId: string) => adminAuditQueryKey(adminId),
  page: (adminId: string, query: AuditQuery, transport?: HttpTransport) =>
    queryOptions({
      queryKey: [...auditQueries.all(adminId), query],
      queryFn: ({ signal }) => listAuditEntries(query, transport, signal),
      staleTime: 15_000,
    }),
};
