import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { petQueries } from "../queries";

/**
 * Prefetch de "Meus pets" para o `HydrationBoundary` (REQ-PETS-006): a lista chega pronta, sem loader no
 * primeiro acesso. Chame depois de `requireRole`. Falha fica no cache como erro; o navegador tenta de novo.
 *
 * @example await prefetchMyPets(queryClient, user.id);
 */
export async function prefetchMyPets(queryClient: QueryClient, accountId: string): Promise<void> {
  await queryClient.prefetchQuery(petQueries.mine(accountId, await backendForRequest()));
}
