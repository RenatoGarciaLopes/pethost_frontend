import { BookingConversation } from "@/widgets/booking-conversation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { bookingCopy, isBookingId } from "@/features/bookings";
import { OwnerStayDetailScreen } from "@/features/bookings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = {
  title: bookingCopy.pageTitles.ownerDetail,
  robots: { index: false, follow: false },
};

interface OwnerBookingPageProps {
  params: Promise<{ bookingId: string }>;
}

/** `/owner/bookings/{id}` (spec 052): a estadia do tutor; id que não é UUID vira 404. */
export default function OwnerBookingPage(props: OwnerBookingPageProps) {
  return (
    <Suspense fallback={<SniffLoader label={bookingCopy.loading} />}>
      <OwnerBookingContent {...props} />
    </Suspense>
  );
}

async function OwnerBookingContent({ params }: OwnerBookingPageProps) {
  const { bookingId } = await params;
  if (!isBookingId(bookingId)) notFound();
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("owner", `/owner/bookings/${bookingId}`);
  return (
    <OwnerStayDetailScreen
      conversation={<BookingConversation accountId={user.id} bookingId={bookingId} side="owner" />}
      accountId={user.id}
      bookingId={bookingId}
    />
  );
}
