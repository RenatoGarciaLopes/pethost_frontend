import "server-only";
import { notFound } from "next/navigation";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import type { StripeStatus } from "../contracts";
import { adminHostQueries } from "../queries";
/** Lista de anfitriões com filtro real de recebimento; pressupõe requireRole(admin).
 * @example await prefetchAdminHosts(client, admin.id, "rejected")
 */
export async function prefetchAdminHosts(client: QueryClient, accountId: string, stripeStatus?: StripeStatus) {
  return client.fetchQuery(adminHostQueries.list(accountId, stripeStatus, await backendForRequest()));
}
/** Detalhe privado pelo hostId; ausente vira 404 da casca. @example await prefetchAdminHost(client, admin.id, id) */
export async function prefetchAdminHost(client: QueryClient, accountId: string, id: string) {
  try {
    return await client.fetchQuery(adminHostQueries.detail(accountId, id, await backendForRequest()));
  } catch (error) {
    if (hasErrorCode(error, "HOST_NOT_FOUND")) notFound();
    throw error;
  }
}
