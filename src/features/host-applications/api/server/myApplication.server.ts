import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { cache } from "react";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { MyApplication } from "../../types";
import { myApplicationQueries } from "../queries";

/**
 * "Minha verificação" da conta, uma busca por requisição (`cache()`): o painel das etapas, a tela e o prefetch dividem
 * o mesmo `GET /hosts/me/application`. Chame depois de `requireRole("host")`. Falha lança o `ApiError`.
 *
 * @example const mine = await getMyApplication(user.id);
 */
export const getMyApplication = cache(async (accountId: string): Promise<MyApplication> =>
  createQueryClient().fetchQuery(myApplicationQueries.mine(accountId, await backendForRequest())),
);

/**
 * Prefetch para o `HydrationBoundary`: a tela abre pronta, e a página decide para onde ir (rascunho vai para as
 * fotos; sem rascunho, `/documents` volta ao status). Falha devolve `undefined` e deixa o navegador buscar (e mostrar
 * o erro com "Tentar de novo").
 *
 * @example const mine = await prefetchMyApplication(queryClient, user.id);
 */
export async function prefetchMyApplication(
  queryClient: QueryClient,
  accountId: string,
): Promise<MyApplication | undefined> {
  try {
    const mine = await getMyApplication(accountId);
    queryClient.setQueryData(myApplicationQueries.mine(accountId).queryKey, mine);
    return mine;
  } catch {
    return undefined;
  }
}
