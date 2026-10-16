"use client";
import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { auditCopy as copy } from "../../../lib/auditCopy";
import { auditSearchSchema, sanitizeAuditSearchParams } from "../../../schemas/auditSearchSchema";
import { useSearchParamsState } from "@/shared/hooks/useSearchParamsState";
import { AuditFilters } from "../AuditFilters";
import { AuditTable } from "../AuditTable/AuditTable";

/** Explorer conectado à URL e pré-carregado pelo servidor.
 * @example <AuditExplorer accountId={admin.id} initialInvalidFilters={[]} />
 */
export interface AuditExplorerProps {
  accountId: string;
  initialInvalidFilters: readonly string[];
}

/** Título, filtros validados e tabela paginada da auditoria.
 * @example <AuditExplorer accountId={admin.id} initialInvalidFilters={invalid} />
 */
export function AuditExplorer({ accountId, initialInvalidFilters }: AuditExplorerProps) {
  const [filters, setFilters] = useSearchParamsState(auditSearchSchema);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryString = searchParams.toString();
  const raw = Object.fromEntries(
    [...new Set(searchParams.keys())].map((key) => {
      const values = searchParams.getAll(key);
      return [key, values.length === 1 ? values[0] : values];
    }),
  );
  const parsed = sanitizeAuditSearchParams(raw);
  const invalidSignature = parsed.invalid.join(",");
  const invalidFields = parsed.invalid.length ? parsed.invalid : initialInvalidFilters;
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [clearVersion, setClearVersion] = useState(0);
  const showInvalidNotice = invalidFields.length > 0 && !noticeDismissed;

  useEffect(() => {
    if (!invalidSignature) return;
    const next = new URLSearchParams(queryString);
    invalidSignature.split(",").forEach((key) => next.delete(key));
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }, [invalidSignature, pathname, queryString, router]);

  function applyFilters(next: typeof filters) {
    setNoticeDismissed(true);
    setFilters({
      action: next.action,
      targetType: next.targetType,
      targetId: next.targetId,
      actorId: next.actorId,
      from: next.from,
      to: next.to,
      page: 1,
      pageSize: next.pageSize,
    });
  }

  function clearFilters() {
    setClearVersion((version) => version + 1);
    applyFilters({ page: 1, pageSize: filters.pageSize });
  }

  const rangeInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);

  return (
    <Box sx={{ py: 3 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        {copy.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {copy.subtitle}
      </Typography>
      {showInvalidNotice && (
        <Typography role="alert" sx={{ mb: 2 }}>
          {copy.invalidFilters} {invalidFields.join(", ")}
          <Button type="button" onClick={() => setNoticeDismissed(true)} sx={{ ml: 1 }}>
            Fechar aviso
          </Button>
        </Typography>
      )}
      <AuditFilters
        key={`${clearVersion}:${JSON.stringify(filters)}`}
        filters={filters}
        invalidFields={invalidFields}
        onApply={applyFilters}
        onClear={clearFilters}
      />
      <Box sx={{ mt: 3 }}>
        <AuditTable adminId={accountId} filters={filters} onFiltersChange={setFilters} invalidRange={rangeInvalid} />
      </Box>
    </Box>
  );
}
