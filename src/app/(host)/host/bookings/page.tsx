import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { bookingCopy } from "@/features/bookings";
import { HostBookingsScreen } from "@/features/bookings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: bookingCopy.pageTitles.hostList, robots: { index: false, follow: false } };

interface HostBookingsPageProps {
  searchParams: Promise<SearchParams>;
}

/** `/host/bookings` (spec 053): pedidos e estadias do anfitrião, com a aba na URL (`?aba=`). */
export default function HostBookingsPage(props: HostBookingsPageProps) {
  return (
    <Suspense fallback={<SniffLoader label={bookingCopy.loading} />}>
      <HostBookingsContent {...props} />
    </Suspense>
  );
}

async function HostBookingsContent({ searchParams }: HostBookingsPageProps) {
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("host", "/host/bookings");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(firstParam(params.pagina) ?? "1", 10) || 1);
  return <HostBookingsScreen accountId={user.id} tab={firstParam(params.aba)} page={page} />;
}
