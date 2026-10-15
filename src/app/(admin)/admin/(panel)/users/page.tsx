import { Suspense } from "react";
import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireRole } from "@/shared/auth/server/requireRole";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { prefetchAdminOwners } from "@/features/owners/index.server";
import { prefetchAdminHosts } from "@/features/hosts/index.server";
import { accountsSearchSchema } from "@/widgets/admin-accounts";
import { AccountsDirectory } from "@/widgets/admin-accounts/index.client";
export const metadata = { title: "Contas · PetHost", robots: { index: false, follow: false } };
/** Diretório privado, filtro Stripe no servidor e nenhuma busca pessoal no prefetch. @example /admin/users?type=hosts */
export default function AccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <Suspense fallback={<SniffLoader />}><Content searchParams={searchParams} /></Suspense>; }
async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireRole("admin", "/admin/users");
  const filters = accountsSearchSchema.parse(await searchParams);
  const client = getQueryClient();
  if (filters.type === "owners") await prefetchAdminOwners(client, user.id);
  else await prefetchAdminHosts(client, user.id, filters.stripeStatus === "all" ? undefined : filters.stripeStatus);
  return <Container maxWidth="xl"><HydrationBoundary state={dehydrate(client)}><AccountsDirectory accountId={user.id} /></HydrationBoundary></Container>;
}
