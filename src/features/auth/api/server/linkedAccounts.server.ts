import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { linkedAccountsSchema, LINKED_ACCOUNTS_STALE_TIME } from "../contracts/linkedAccounts";

/**
 * Prefetch por usuário no servidor para HydrationBoundary. Chame após requireRole; não autoriza acesso.
 * QueryClient.prefetchQuery conserva falhas sem lançar; o hook pode tentar novamente pelo BFF.
 * @example await prefetchLinkedAccounts(queryClient, user.id);
 */
export async function prefetchLinkedAccounts(queryClient: QueryClient, userId: string): Promise<void> {
  const backend = await backendForRequest();
  await queryClient.prefetchQuery({
    queryKey: accountQueryKey(userId, "linked-accounts"),
    staleTime: LINKED_ACCOUNTS_STALE_TIME,
    queryFn: () => backend.request({ method: "GET", path: "/users/me/accounts" }, linkedAccountsSchema),
  });
}
