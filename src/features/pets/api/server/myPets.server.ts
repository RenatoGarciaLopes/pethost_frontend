import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { petQueries } from "../queries";
import { isKeeperPending } from "../../lib/isKeeperPending";

/**
 * Prefetch de "Meus pets" para o `HydrationBoundary` (REQ-PETS-006): a lista chega pronta, sem loader no
 * primeiro acesso. Chame depois de `requireRole`. Falha fica no cache; o retorno distingue perfil ainda
 * pendente (023), para a tela não tratar a espera pela aprovação como erro nem liberar o formulário.
 *
 * @example await prefetchMyPets(queryClient, user.id);
 */
export async function prefetchMyPets(queryClient: QueryClient, accountId: string): Promise<{ keeperPending: boolean }> {
  await queryClient.prefetchQuery(petQueries.mine(accountId, await backendForRequest()));
  return { keeperPending: isKeeperPending(queryClient.getQueryState(petQueries.mine(accountId).queryKey)?.error) };
}
