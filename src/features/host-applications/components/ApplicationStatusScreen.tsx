import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchMyApplication } from "../api/server/myApplication.server";
import { ApplicationStatusView } from "./client/ApplicationStatusView/ApplicationStatusView";

/**
 * `/host/application` no servidor (spec 030): busca a verificação antes de responder e entrega o cache hidratado, sem
 * loader no primeiro acesso. Falha na busca deixa a vista mostrar o erro com "Tentar de novo".
 *
 * @example <ApplicationStatusScreen accountId={user.id} />
 */
export async function ApplicationStatusScreen({ accountId }: { accountId: string }) {
  const queryClient = getQueryClient();
  await prefetchMyApplication(queryClient, accountId);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationStatusView accountId={accountId} />
    </HydrationBoundary>
  );
}
