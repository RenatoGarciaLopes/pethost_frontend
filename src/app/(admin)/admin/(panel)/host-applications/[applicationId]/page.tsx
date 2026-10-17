import { Suspense } from "react";
import { z } from "zod";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireRole } from "@/shared/auth/server/requireRole";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { prefetchAdminApplication } from "@/features/admin-host-applications/index.server";
import { HostApplicationReview } from "@/widgets/host-application-review/index.client";

export const metadata = { title: "Conferir verificação · PetHost", robots: { index: false, follow: false } };
/** Detalhe administrativo com UUID validado e nenhuma foto no HTML inicial. @example /admin/host-applications/{id} */
export default function ReviewPage({ params }: { params: Promise<{ applicationId: string }> }) {
  return (
    <Suspense fallback={<SniffLoader />}>
      <ReviewContent params={params} />
    </Suspense>
  );
}
async function ReviewContent({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const user = await requireRole("admin", `/admin/host-applications/${applicationId}`);
  if (!z.string().uuid().safeParse(applicationId).success) notFound();
  const client = getQueryClient();
  await prefetchAdminApplication(client, user.id, applicationId);
  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(client)}>
        <HostApplicationReview accountId={user.id} applicationId={applicationId} />
      </HydrationBoundary>
    </PageContainer>
  );
}
