"use client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Button,
  Link,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminDataTable, type AdminTableColumn } from "@/shared/ui/data-display/AdminDataTable";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { formatDateTime } from "@/shared/lib/date/formatDateTime";
import type { AuditEntry } from "../../../api/contracts";
import { auditQueries } from "../../../api/queries";
import { auditActionCopy } from "../../../lib/auditActionCopy";
import { auditCopy as copy } from "../../../lib/auditCopy";
import { auditTargetFilterHref } from "../../../lib/auditTargetLink";
import { toAuditQuery } from "../../../lib/toAuditQuery";
import { auditSearchSchema, hasInvalidAuditDateRange, type AuditSearch } from "../../../schemas/auditSearchSchema";
import { AuditEntryDetail } from "../AuditEntryDetail";
import { useSearchParamsState } from "@/shared/hooks/useSearchParamsState";

/** Filtros travados recebidos por composições como o detalhe da 032.
 * @example const fixed: AuditFixedFilters = { targetType: "owner", targetId: ownerId }
 */
export interface AuditFixedFilters {
  targetType: string;
  targetId: string;
}

/** Tabela da API paginada, completa ou compacta.
 * @example <AuditTable adminId={admin.id} filters={filters} onFiltersChange={setFilters} />
 */
export interface AuditTableProps {
  adminId: string;
  filters?: AuditSearch;
  onFiltersChange?: (patch: Partial<AuditSearch>) => void;
  invalidRange?: boolean;
  fixedFilters?: AuditFixedFilters;
  variant?: "full" | "compact";
}

/** Tabela acessível com detalhe por link e paginação real do endpoint.
 * @example <AuditTable adminId={admin.id} fixedFilters={{ targetType: "owner", targetId }} variant="compact" />
 */
export function AuditTable({
  adminId,
  filters: controlledFilters,
  onFiltersChange,
  invalidRange,
  fixedFilters,
  variant = "full",
}: AuditTableProps) {
  const [urlFilters, setUrlFilters] = useSearchParamsState(auditSearchSchema);
  const filters = controlledFilters ?? urlFilters;
  const updateFilters = onFiltersChange ?? setUrlFilters;
  const rangeInvalid = invalidRange ?? hasInvalidAuditDateRange(filters);
  const compact = variant === "compact";
  const pageSize = compact ? 10 : filters.pageSize;
  const request = rangeInvalid
    ? { page: filters.page, pageSize, targetType: fixedFilters?.targetType, targetId: fixedFilters?.targetId }
    : { ...toAuditQuery(filters, fixedFilters), pageSize };
  const query = useQuery({
    ...auditQueries.page(adminId, request),
    enabled: !rangeInvalid,
    placeholderData: keepPreviousData,
  });
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const entries = query.data?.items ?? [];
  const selectedId = params.get("entryId");
  const selected = entries.find((entry) => entry.id === selectedId) ?? null;

  function hrefForEntry(entry: AuditEntry) {
    const next = new URLSearchParams(params.toString());
    next.set("entryId", entry.id);
    return `${pathname}?${next.toString()}`;
  }

  function closeDetail() {
    const next = new URLSearchParams(params.toString());
    next.delete("entryId");
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  const columns: AdminTableColumn<AuditEntry>[] = [
    {
      key: "occurredAt",
      label: copy.occurredAt,
      render: (entry) => formatDateTime(entry.occurredAt),
    },
    {
      key: "action",
      label: copy.action,
      render: (entry) => {
        const action = auditActionCopy(entry.action);
        return (
          <Stack>
            <span>{action.label}</span>
            {!action.known && (
              <Typography component="code" variant="caption">
                {entry.action}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      key: "target",
      label: copy.target,
      render: (entry) => {
        const targetLabel =
          copy.targetTypes.find((target) => target.value === entry.targetType)?.label ?? entry.targetType;
        return <span>{entry.targetId ? `${targetLabel} · ${entry.targetId.slice(0, 8)}` : targetLabel}</span>;
      },
    },
    {
      key: "actor",
      label: copy.actor,
      render: (entry) =>
        entry.actorId ? (copy.roles[entry.actorRole ?? ""] ?? entry.actorRole ?? copy.unavailable) : copy.unavailable,
    },
    { key: "reason", label: copy.reason, render: (entry) => entry.reason ?? copy.unavailable },
  ];

  if (rangeInvalid) return <Typography role="alert">{copy.invalidRange}</Typography>;
  if (query.isPending) return <AuditTableSkeleton />;
  if (query.isError) return <ErrorState title={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;

  const totalPages = query.data.totalPages ?? Math.max(1, Math.ceil(query.data.totalCount / pageSize));
  const clearFilters = () =>
    updateFilters({
      action: undefined,
      targetType: undefined,
      targetId: undefined,
      actorId: undefined,
      from: undefined,
      to: undefined,
      page: 1,
    });
  if (!entries.length && query.data.totalCount === 0) {
    return compact ? (
      <Typography>{copy.empty}</Typography>
    ) : (
      <EmptyState title={copy.empty} action={<Button onClick={clearFilters}>{copy.clear}</Button>} />
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        component="div"
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", gap: 1 }}
      >
        <Typography role="status">{copy.count(entries.length, query.data.totalCount)}</Typography>
        {!compact && (
          <TextField
            select
            size="small"
            label={copy.pageSize}
            value={filters.pageSize}
            onChange={(event) =>
              updateFilters({ pageSize: Number(event.target.value) as AuditSearch["pageSize"], page: 1 })
            }
          >
            {[20, 50, 100].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
      {!entries.length && <Typography role="status">{copy.empty}</Typography>}
      <AdminDataTable
        label={copy.tableLabel}
        rows={entries}
        columns={columns}
        rowKey={(entry) => entry.id}
        rowHref={hrefForEntry}
        rowLabel={(entry) => copy.openDetails(auditActionCopy(entry.action).label)}
        page={1}
        pageSize={Math.max(entries.length, 1)}
        onPageChange={() => {}}
        empty={<span />}
      />
      {(totalPages > 1 || filters.page > totalPages) && (
        <Pagination
          aria-label={copy.page}
          count={totalPages}
          page={filters.page}
          onChange={(_, page) => updateFilters({ page })}
          getItemAriaLabel={(type, pageNumber, selectedPage) =>
            type === "page" ? `${selectedPage ? "Página atual" : "Ir para a página"} ${pageNumber}` : type
          }
          sx={{ "& .MuiPaginationItem-root": { minWidth: 44, height: 44 } }}
        />
      )}
      {compact && fixedFilters && (
        <Link component={NextLink} href={auditTargetFilterHref(fixedFilters.targetType, fixedFilters.targetId)}>
          Ver auditoria completa
        </Link>
      )}
      <AuditEntryDetail entry={selected} onClose={closeDetail} />
    </Stack>
  );
}

function AuditTableSkeleton() {
  return (
    <Table aria-label={copy.tableLabel}>
      <TableHead>
        <TableRow>
          {[copy.occurredAt, copy.action, copy.target, copy.actor, copy.reason].map((label) => (
            <TableCell key={label}>{label}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 4 }, (_, row) => (
          <TableRow key={row}>
            {Array.from({ length: 5 }, (_, cell) => (
              <TableCell key={cell}>
                <Skeleton />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
