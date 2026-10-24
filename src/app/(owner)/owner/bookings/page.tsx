import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { bookingCopy } from "@/features/bookings";
import { OwnerStaysScreen } from "@/features/bookings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: bookingCopy.pageTitles.ownerList, robots: { index: false, follow: false } };

/** `/owner/bookings` (specs 052 e 094): as estadias do tutor numa lista só, em ordem de relevância. */
export default function OwnerBookingsPage() {
  return (
    <Suspense fallback={<SniffLoader label={bookingCopy.loading} />}>
      <OwnerBookingsContent />
    </Suspense>
  );
}

async function OwnerBookingsContent() {
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("owner", "/owner/bookings");
  return <OwnerStaysScreen accountId={user.id} />;
}
