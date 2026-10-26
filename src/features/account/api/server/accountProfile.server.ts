import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { gatewayFor } from "../client/profileGateway";
import { ACCOUNT_PROFILE_STALE_TIME } from "../contracts/profile";
/**
 * Prefetch por usuário autenticado após requireRole, com QueryClient isolado por requisição.
 * Reutiliza gateway com backend autenticado; falha fica no cache para refetch no client.
 * @example await prefetchAccountProfile(queryClient, user.id, "owner");
 */
export async function prefetchAccountProfile(
  queryClient: QueryClient,
  userId: string,
  role: PersonalRole,
): Promise<void> {
  const transport = await backendForRequest();
  await queryClient.prefetchQuery({
    queryKey: accountQueryKey(userId, "profile"),
    staleTime: ACCOUNT_PROFILE_STALE_TIME,
    queryFn: () => gatewayFor(role, transport).load(),
  });
}
