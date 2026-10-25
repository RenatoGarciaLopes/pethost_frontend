import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { isBookingId, paymentCopy } from "@/features/bookings";
import { BookingPaymentScreen, getBookingDetail } from "@/features/bookings/index.server";
import { getListingPageDetail } from "@/features/listing-page/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: paymentCopy.pageTitle, robots: { index: false, follow: false } };

/** Checkout owner da 066; valida UUID antes da sessão, mantendo as guardas das estadias. */
export default function PaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  return (
    <Suspense fallback={<SniffLoader label={paymentCopy.loading} />}>
      <PaymentContent params={params} />
    </Suspense>
  );
}

async function PaymentContent({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  if (!isBookingId(bookingId)) notFound();
  await connection();
  const user = await requireRole("owner", `/owner/bookings/${bookingId}/payment`);
  const booking = await getBookingDetail(user.id, bookingId);
  let coverUrl: string | undefined;
  if (booking.listing) {
    try {
      coverUrl = (await getListingPageDetail(user.id, booking.listing.id)).photos[0]?.url;
    } catch {
      /* Cantinho removido/foto indisponível não impede pagar uma reserva existente. */
    }
  }
  return <BookingPaymentScreen accountId={user.id} bookingId={bookingId} coverUrl={coverUrl} />;
}
