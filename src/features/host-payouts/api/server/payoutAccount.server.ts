import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { payoutQueries } from "../queries";
/** Prefetch autenticado com estado null para quem ainda não foi verificado. Outros erros ficam no cache para a tela de recuperação. @example await prefetchPayoutAccount(client, user.id); */
export async function prefetchPayoutAccount(client: QueryClient, accountId: string): Promise<void> {
  await client.prefetchQuery(payoutQueries.account(accountId, await backendForRequest()));
}
