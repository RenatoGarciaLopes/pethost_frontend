import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { MyApplication } from "../../types";
import { myApplicationQueries } from "../queries";

/**
 * Prefetch de "Minha verificação" para o `HydrationBoundary`: a tela abre pronta, e a página decide para onde ir
 * (rascunho vai para as fotos; sem rascunho, `/documents` volta ao status). Chame depois de `requireRole("host")`.
 * Falha fica no cache como erro (o navegador tenta de novo) e devolve `undefined`.
 *
 * @example const mine = await prefetchMyApplication(queryClient, user.id);
 */
export async function prefetchMyApplication(
  queryClient: QueryClient,
  accountId: string,
): Promise<MyApplication | undefined> {
  const options = myApplicationQueries.mine(accountId, await backendForRequest());
  await queryClient.prefetchQuery(options);
  return queryClient.getQueryData(options.queryKey);
}
