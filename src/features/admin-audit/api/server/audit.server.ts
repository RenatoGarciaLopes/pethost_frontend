import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { AuditQuery } from "../../lib/toAuditQuery";
import { auditQueries } from "../queries";

/** Prefetch autenticado da página da trilha; chame somente após requireRole(admin).
 * @example await prefetchAuditEntries(queryClient, admin.id, query)
 */
export async function prefetchAuditEntries(
  client: QueryClient,
  adminId: string,
  query: AuditQuery,
  transport?: HttpTransport,
) {
  return client.fetchQuery(auditQueries.page(adminId, query, transport ?? (await backendForRequest())));
}
