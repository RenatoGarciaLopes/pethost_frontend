import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { listingCopy } from "@/features/host-listings";
import { ListingDraftScreen } from "@/features/host-listings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: listingCopy.pageTitles.new, robots: { index: false, follow: false } };

/** `/host/listings/new` (spec 044): o cadastro do cantinho, só com o recebimento liberado. */
export default function NewListingPage() {
  return (
    <Suspense fallback={<SniffLoader label={listingCopy.loading} />}>
      <NewListingContent />
    </Suspense>
  );
}

async function NewListingContent() {
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("host", "/host/listings/new");
  return <ListingDraftScreen accountId={user.id} />;
}
