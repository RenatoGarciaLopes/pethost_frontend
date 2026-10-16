import { Stack } from "@mui/material";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { PageHeader } from "@/shared/ui/layout/PageHeader";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { bookingQueries } from "../api/queries";
import { bookingCopy } from "../lib/bookingCopy";
import { HOST_TABS, hostTabOf } from "../lib/bookingStatus";
import { HostBookingList } from "./client/HostBookingList";

/**
 * `/host/bookings` no servidor (spec 053): busca a aba da URL e o contador de pedidos antes de responder e entrega o
 * cache hidratado. Falha na busca deixa a lista mostrar o erro com "Tentar de novo".
 *
 * @example <HostBookingsScreen accountId={user.id} tab="pedidos" page={1} />
 */
export async function HostBookingsScreen({ accountId, tab, page }: { accountId: string; tab?: string; page: number }) {
  const current = hostTabOf(tab);
  const queryClient = getQueryClient();
  const transport = await backendForRequest();
  await Promise.all([
    queryClient.prefetchQuery(bookingQueries.mine(accountId, { statuses: current.statuses, page }, transport)),
    queryClient.prefetchQuery(bookingQueries.mine(accountId, { statuses: HOST_TABS[0]!.statuses }, transport)),
  ]);
  return (
    <PageContainer width="page">
      <Stack spacing={3}>
        <PageHeader title={bookingCopy.host.heading} />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <HostBookingList accountId={accountId} tab={current} page={page} />
        </HydrationBoundary>
      </Stack>
    </PageContainer>
  );
}
