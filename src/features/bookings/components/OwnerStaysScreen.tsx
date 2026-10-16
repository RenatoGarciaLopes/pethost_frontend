import { Stack } from "@mui/material";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { PageHeader } from "@/shared/ui/layout/PageHeader";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { bookingQueries } from "../api/queries";
import { bookingCopy } from "../lib/bookingCopy";
import { ownerTabOf } from "../lib/bookingStatus";
import { StayList } from "./client/StayList";

/**
 * `/owner/bookings` no servidor (spec 052, REQ-STAYS-001): o primeiro carregamento da aba vem do servidor, hidratado.
 * Falha na busca deixa a lista mostrar o erro com "Tentar de novo".
 *
 * @example <OwnerStaysScreen accountId={user.id} tab="proximas" />
 */
export async function OwnerStaysScreen({ accountId, tab }: { accountId: string; tab?: string }) {
  const current = ownerTabOf(tab);
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    bookingQueries.infinite(accountId, current.statuses, undefined, await backendForRequest()),
  );
  return (
    <PageContainer width="page">
      <Stack spacing={3}>
        <PageHeader title={bookingCopy.owner.heading} />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <StayList accountId={accountId} tab={current} />
        </HydrationBoundary>
      </Stack>
    </PageContainer>
  );
}
