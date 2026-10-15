import { Suspense } from "react";
import { z } from "zod";
import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireRole } from "@/shared/auth/server/requireRole";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { prefetchAdminOwner } from "@/features/owners/index.server";
import { AccountDetail } from "@/widgets/admin-accounts/index.client";
export const metadata = { title: "Conta de tutor · PetHost", robots: { index: false, follow: false } };
/** Detalhe de tutor autorizado pelo servidor, com UUID e noindex. @example /admin/users/owners/{ownerId} */
export default function OwnerPage({ params }: { params: Promise<{ ownerId: string }> }) { return <Suspense fallback={<SniffLoader />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ ownerId: string }> }) {
  const { ownerId } = await params;
  const user = await requireRole("admin", `/admin/users/owners/${ownerId}`);
  if (!z.string().uuid().safeParse(ownerId).success) notFound();
  const client = getQueryClient(); await prefetchAdminOwner(client, user.id, ownerId);
  return <Container maxWidth="lg"><HydrationBoundary state={dehydrate(client)}><AccountDetail accountId={user.id} kind="owners" resourceId={ownerId} /></HydrationBoundary></Container>;
}
