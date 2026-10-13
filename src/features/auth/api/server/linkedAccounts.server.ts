import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { cookies, headers } from "next/headers";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { createBackendClient, forwardedForOf } from "@/shared/api/server/backendClient";
import { readSessionTokens } from "@/shared/auth/server/sessionCookies";
import { linkedAccountsSchema, LINKED_ACCOUNTS_STALE_TIME } from "../contracts/linkedAccounts";

/**
 * Prefetch por usuário no servidor para HydrationBoundary. Chame após requireRole; não autoriza acesso.
 * QueryClient.prefetchQuery conserva falhas sem lançar; o hook pode tentar novamente pelo BFF.
 * @example await prefetchLinkedAccounts(queryClient, user.id);
 */
export async function prefetchLinkedAccounts(queryClient: QueryClient, userId: string): Promise<void> {
  const { accessToken } = readSessionTokens(await cookies());
  const backend = createBackendClient({ accessToken, forwardedFor: forwardedForOf(await headers()) });
  await queryClient.prefetchQuery({
    queryKey: accountQueryKey(userId, "linked-accounts"),
    staleTime: LINKED_ACCOUNTS_STALE_TIME,
    queryFn: () => backend.request({ method: "GET", path: "/users/me/accounts" }, linkedAccountsSchema),
  });
}
