"use client";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { useId } from "react";
import { AdminDataTable } from "@/shared/ui/data-display/AdminDataTable";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { useSearchParamsState } from "@/shared/hooks/useSearchParamsState";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { queueSearchSchema } from "../schemas/reviewSchemas";
import { adminApplicationQueries } from "../api/queries";
import { applicationStatusSchema, type AdminApplication, type ApplicationStatus } from "../api/contracts";
import { adminReviewCopy as copy } from "../lib/adminReviewCopy";

interface QueueViewProps {
  rows: readonly AdminApplication[];
  status: ApplicationStatus;
  page: number;
  onChange: (patch: { status?: ApplicationStatus; page?: number }) => void;
}
/** Fila administrativa sem E/S para stories e composição; ordenação inicial respeita espera.
 * @example <ApplicationQueueView rows={items} status="submitted" page={1} onChange={setFilters} />
 */
export function ApplicationQueueView({ rows, status, page, onChange }: QueueViewProps) {
  // Rótulo ligado por id: envolvendo o select, o texto do rótulo levaria junto o de todas as opções.
  const filterId = useId();
  const ordered = [...rows].sort((a, b) => (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt));
  return (
    <Box sx={{ py: 3 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        {copy.title}
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box component="label" htmlFor={filterId} sx={{ mr: 1 }}>
          {copy.filter}
        </Box>
        <Box
          component="select"
          id={filterId}
          value={status}
          onChange={(event) => onChange({ status: applicationStatusSchema.parse(event.target.value), page: 1 })}
          sx={{ minHeight: 44, p: 1, font: "inherit", maxWidth: "100%" }}
        >
          {applicationStatusSchema.options.map((value) => (
            <option key={value} value={value}>
              {copy.status[value]}
            </option>
          ))}
        </Box>
      </Box>
      <AdminDataTable
        label={copy.title}
        rows={ordered}
        page={page}
        onPageChange={(next) => onChange({ page: next })}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/host-applications/${row.id}`}
        rowLabel={(row) => row.user?.fullName ?? copy.unavailable}
        empty={<EmptyState title={copy.empty} illustration={<span />} />}
        columns={[
          {
            key: "name",
            label: copy.name,
            render: (row) => row.user?.fullName ?? copy.unavailable,
            compare: (a, b) => (a.user?.fullName ?? "").localeCompare(b.user?.fullName ?? ""),
          },
          { key: "type", label: copy.type, render: (row) => copy.person[row.personType] },
          { key: "attempt", label: copy.attempt, render: (row) => row.attemptNumber },
          {
            key: "wait",
            label: copy.wait,
            render: (row) =>
              `${Math.max(0, Math.floor((Date.now() - Date.parse(row.submittedAt ?? row.createdAt)) / 86_400_000))} dia(s)`,
          },
          {
            key: "status",
            label: copy.statusLabel,
            render: (row) => <StatusPill size="sm" label={copy.status[row.status]} />,
          },
        ]}
      />
    </Box>
  );
}
/** Fila hidratada e filtrada pela URL, isolada por conta administrativa.
 * @example <ApplicationQueue accountId={user.id} />
 */
export function ApplicationQueue({ accountId }: { accountId: string }) {
  const [filters, setFilters] = useSearchParamsState(queueSearchSchema);
  const query = useQuery(adminApplicationQueries.queue(accountId, filters.status));
  if (query.isPending) return <SniffLoader />;
  if (query.isError) return <ErrorState title={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  return <ApplicationQueueView rows={query.data} status={filters.status} page={filters.page} onChange={setFilters} />;
}
