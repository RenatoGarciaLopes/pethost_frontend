import "server-only";
import { notFound } from "next/navigation";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { adminOwnerQueries } from "../queries";
/** Prefetch privado da lista; pressupõe requireRole(admin). @example await prefetchAdminOwners(client, admin.id) */
export async function prefetchAdminOwners(client: QueryClient, accountId: string) {
  return client.fetchQuery(adminOwnerQueries.list(accountId, await backendForRequest()));
}
/** Detalhe pelo ownerId, sem cache público; recurso ausente vira 404.
 * @example await prefetchAdminOwner(client, admin.id, ownerId)
 */
export async function prefetchAdminOwner(client: QueryClient, accountId: string, id: string) {
  try {
    return await client.fetchQuery(adminOwnerQueries.detail(accountId, id, await backendForRequest()));
  } catch (error) {
    if (hasErrorCode(error, "OWNER_NOT_FOUND")) notFound();
    throw error;
  }
}
