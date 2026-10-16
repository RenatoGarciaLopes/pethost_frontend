import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { bookingCopy, isBookingId } from "@/features/bookings";
import { getBookingDetail, HostBookingDetailScreen } from "@/features/bookings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { BookingPetProfiles } from "@/widgets/booking-pet-profiles";

export const metadata: Metadata = { title: bookingCopy.pageTitles.hostDetail, robots: { index: false, follow: false } };

interface HostBookingPageProps {
  params: Promise<{ bookingId: string }>;
}

/** `/host/bookings/{id}` (spec 053): o pedido com a ficha dos pets; id que não é UUID vira 404. */
export default function HostBookingPage(props: HostBookingPageProps) {
  return (
    <Suspense fallback={<SniffLoader label={bookingCopy.loading} />}>
      <HostBookingContent {...props} />
    </Suspense>
  );
}

async function HostBookingContent({ params }: HostBookingPageProps) {
  const { bookingId } = await params;
  if (!isBookingId(bookingId)) notFound();
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("host", `/host/bookings/${bookingId}`);
  const booking = await getBookingDetail(user.id, bookingId);
  return (
    <HostBookingDetailScreen
      accountId={user.id}
      bookingId={bookingId}
      petProfiles={<BookingPetProfiles accountId={user.id} pets={booking.pets} />}
    />
  );
}
