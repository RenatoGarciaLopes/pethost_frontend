import { Suspense } from "react";
import { z } from "zod";
import { notFound } from "next/navigation";
import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireRole } from "@/shared/auth/server/requireRole";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { prefetchAdminHost } from "@/features/hosts/index.server";
import { AccountDetail } from "@/widgets/admin-accounts/index.client";
export const metadata = { title: "Conta de anfitrião · PetHost", robots: { index: false, follow: false } };
/** Detalhe administrativo, incluindo recebimento e nova chance no Stripe. @example /admin/users/hosts/{hostId} */
export default function HostPage({ params }: { params: Promise<{ hostId: string }> }) { return <Suspense fallback={<SniffLoader />}><Content params={params} /></Suspense>; }
async function Content({ params }: { params: Promise<{ hostId: string }> }) {
  const { hostId } = await params;
  const user = await requireRole("admin", `/admin/users/hosts/${hostId}`);
  if (!z.string().uuid().safeParse(hostId).success) notFound();
  const client = getQueryClient(); await prefetchAdminHost(client, user.id, hostId);
  return <Container maxWidth="lg"><HydrationBoundary state={dehydrate(client)}><AccountDetail accountId={user.id} kind="hosts" resourceId={hostId} /></HydrationBoundary></Container>;
}
