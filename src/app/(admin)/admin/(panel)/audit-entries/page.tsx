import { Suspense } from "react";
import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { requireRole } from "@/shared/auth/server/requireRole";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { hasInvalidAuditDateRange, sanitizeAuditSearchParams, toAuditQuery } from "@/features/admin-audit";
import { AuditExplorer } from "@/features/admin-audit/index.client";
import { prefetchAuditEntries } from "@/features/admin-audit/index.server";

export const metadata = { title: "Auditoria · PetHost", robots: { index: false, follow: false } };

/** Rota privada e hidratada para investigar a trilha. @example /admin/audit-entries?action=owner.suspended */
export default function AuditEntriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<SniffLoader />}>
      <AuditEntriesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AuditEntriesContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireRole("admin", "/admin/audit-entries");
  const { filters, invalid } = sanitizeAuditSearchParams(await searchParams);
  const client = getQueryClient();
  if (!hasInvalidAuditDateRange(filters)) {
    await prefetchAuditEntries(client, admin.id, toAuditQuery(filters));
  }
  return (
    <Container maxWidth="lg">
      <HydrationBoundary state={dehydrate(client)}>
        <AuditExplorer accountId={admin.id} initialInvalidFilters={invalid} />
      </HydrationBoundary>
    </Container>
  );
}
