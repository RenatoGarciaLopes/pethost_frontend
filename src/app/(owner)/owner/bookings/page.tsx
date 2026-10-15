import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { bookingCopy } from "@/features/bookings";
import { OwnerStaysScreen } from "@/features/bookings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: bookingCopy.pageTitles.ownerList, robots: { index: false, follow: false } };

interface OwnerBookingsPageProps {
  searchParams: Promise<SearchParams>;
}

/** `/owner/bookings` (spec 052): as estadias do tutor, com a aba na URL (`?aba=`). */
export default function OwnerBookingsPage(props: OwnerBookingsPageProps) {
  return (
    <Suspense fallback={<SniffLoader label={bookingCopy.loading} />}>
      <OwnerBookingsContent {...props} />
    </Suspense>
  );
}

async function OwnerBookingsContent({ searchParams }: OwnerBookingsPageProps) {
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("owner", "/owner/bookings");
  return <OwnerStaysScreen accountId={user.id} tab={firstParam((await searchParams).aba)} />;
}
