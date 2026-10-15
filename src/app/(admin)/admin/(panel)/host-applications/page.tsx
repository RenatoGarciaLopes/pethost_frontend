import { Suspense } from "react";
import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireRole } from "@/shared/auth/server/requireRole";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { queueSearchSchema } from "@/features/admin-host-applications";
import { ApplicationQueue } from "@/features/admin-host-applications/index.client";
import { prefetchAdminQueue } from "@/features/admin-host-applications/index.server";

export const metadata = { title: "Fila de verificação · PetHost", robots: { index: false, follow: false } };
/** Fila administrativa com prefetch privado e autorização no servidor. @example /admin/host-applications?status=submitted */
export default function QueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<SniffLoader />}>
      <QueueContent searchParams={searchParams} />
    </Suspense>
  );
}
async function QueueContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireRole("admin", "/admin/host-applications");
  const filters = queueSearchSchema.parse(await searchParams);
  const client = getQueryClient();
  await prefetchAdminQueue(client, user.id, filters.status);
  return (
    <Container maxWidth="lg">
      <HydrationBoundary state={dehydrate(client)}>
        <ApplicationQueue accountId={user.id} />
      </HydrationBoundary>
    </Container>
  );
}
