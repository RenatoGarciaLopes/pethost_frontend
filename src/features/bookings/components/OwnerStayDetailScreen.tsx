import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { bookingQueries } from "../api/queries";
import { getBookingDetail } from "../api/server/bookings.server";
import { StayDetail } from "./client/StayDetail";

/**
 * `/owner/bookings/{id}` no servidor (spec 052): busca a estadia antes de responder (de outra conta ou inexistente vira o
 * 404 da casca, REQ-STAYS-009) e entrega o cache hidratado.
 *
 * @example <OwnerStayDetailScreen accountId={user.id} bookingId={id} />
 */
export async function OwnerStayDetailScreen({ accountId, bookingId }: { accountId: string; bookingId: string }) {
  const queryClient = getQueryClient();
  queryClient.setQueryData(
    bookingQueries.detail(accountId, bookingId).queryKey,
    await getBookingDetail(accountId, bookingId),
  );
  return (
    <PageContainer width="page">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StayDetail accountId={accountId} bookingId={bookingId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
