import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { bookingQueries } from "../api/queries";
import { getBookingDetail } from "../api/server/bookings.server";
import { BookingPayment } from "./client/BookingPayment";

/** Prepara somente a reserva. Sessão Stripe/clientSecret nunca passam pela hidratação server. */
export async function BookingPaymentScreen({
  accountId,
  bookingId,
  coverUrl,
}: {
  accountId: string;
  bookingId: string;
  coverUrl?: string;
}) {
  const client = getQueryClient();
  client.setQueryData(
    bookingQueries.detail(accountId, bookingId).queryKey,
    await getBookingDetail(accountId, bookingId),
  );
  return (
    <Container maxWidth={false} sx={{ maxWidth: 1104, py: { xs: 3, md: 4 } }}>
      <HydrationBoundary state={dehydrate(client)}>
        <BookingPayment accountId={accountId} bookingId={bookingId} coverUrl={coverUrl} />
      </HydrationBoundary>
    </Container>
  );
}
