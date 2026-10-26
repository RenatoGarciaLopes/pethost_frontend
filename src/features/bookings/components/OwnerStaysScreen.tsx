import { Container, Stack } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { BOOKING_STATUSES } from "../api/contracts";
import { bookingQueries } from "../api/queries";
import { bookingCopy } from "../lib/bookingCopy";
import { StayList } from "./client/StayList";

/**
 * `/owner/bookings` no servidor (specs 052 e 094): o primeiro carregamento da lista vem do servidor, hidratado.
 * Falha na busca deixa a lista mostrar o erro com "Tentar de novo".
 *
 * @example <OwnerStaysScreen accountId={user.id} />
 */
export async function OwnerStaysScreen({ accountId }: { accountId: string }) {
  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery(
    bookingQueries.infinite(accountId, BOOKING_STATUSES, undefined, await backendForRequest()),
  );
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <PageHeader eyebrow={bookingCopy.owner.eyebrow} title={bookingCopy.owner.heading} />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <StayList accountId={accountId} />
        </HydrationBoundary>
      </Stack>
    </Container>
  );
}
