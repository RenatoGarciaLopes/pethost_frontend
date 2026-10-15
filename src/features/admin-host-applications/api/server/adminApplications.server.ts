import "server-only";
import { notFound } from "next/navigation";
import type { QueryClient } from "@tanstack/react-query";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { adminApplicationQueries } from "../queries";
import type { ApplicationStatus } from "../contracts";
/** Fila autenticada para hidratação, sem dados de fotos. Chame após requireRole(admin).
 * @example await prefetchAdminQueue(client, user.id, "submitted")
 */
export async function prefetchAdminQueue(client: QueryClient, accountId: string, status: ApplicationStatus) {
  return client.fetchQuery(adminApplicationQueries.queue(accountId, status, await backendForRequest()));
}
/** Detalhe autenticado, 404 da API vira o estado da casca. Não pede links de documento.
 * @example await prefetchAdminApplication(client, user.id, id)
 */
export async function prefetchAdminApplication(client: QueryClient, accountId: string, id: string) {
  try {
    return await client.fetchQuery(adminApplicationQueries.detail(accountId, id, await backendForRequest()));
  } catch (error) {
    if (hasErrorCode(error, "HOST_APPLICATION_NOT_FOUND")) notFound();
    throw error;
  }
}
