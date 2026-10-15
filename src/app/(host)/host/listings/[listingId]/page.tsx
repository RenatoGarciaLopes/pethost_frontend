import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isListingId, listingCopy } from "@/features/host-listings";
import { ListingEditorScreen } from "@/features/host-listings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

interface ListingPageProps {
  params: Promise<{ listingId: string }>;
}

export const metadata: Metadata = { title: listingCopy.pageTitles.listing, robots: { index: false, follow: false } };

/** `/host/listings/{id}` (spec 044): o cantinho do dono, por seções editáveis. Id que não é UUID vira 404. */
export default function ListingPage(props: ListingPageProps) {
  return (
    <Suspense fallback={<SniffLoader label={listingCopy.loading} />}>
      <ListingContent {...props} />
    </Suspense>
  );
}

async function ListingContent({ params }: ListingPageProps) {
  const { listingId } = await params;
  if (!isListingId(listingId)) notFound();
  const user = await requireRole("host", `/host/listings/${listingId}`);
  return <ListingEditorScreen accountId={user.id} listingId={listingId} />;
}
