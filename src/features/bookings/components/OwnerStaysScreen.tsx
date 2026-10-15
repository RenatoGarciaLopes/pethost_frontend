import { Container, Stack, Typography } from "@mui/material";
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
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {bookingCopy.owner.heading}
        </Typography>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <StayList accountId={accountId} tab={current} />
        </HydrationBoundary>
      </Stack>
    </Container>
  );
}
