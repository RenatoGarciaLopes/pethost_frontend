"use client";
import { useId, useState } from "react";
import { Box, Button, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminOwnerQueries } from "@/features/owners";
import { adminHostQueries, stripeStatusSchema } from "@/features/hosts";
import { AdminDataTable, type AdminTableColumn } from "@/shared/ui/data-display/AdminDataTable";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { translateError } from "@/shared/api/errors/translateError";
import { useSearchParamsState } from "@/shared/hooks/useSearchParamsState";
import { accountsSearchSchema } from "../schemas/accountsSearchSchema";
import { filterAccounts, toAccountRow, type AccountRow } from "../lib/accountRows";
import { accountsCopy as copy } from "../lib/accountsCopy";
import type { z } from "zod";

type Filters = z.output<typeof accountsSearchSchema>;
interface DirectoryProps extends Filters {
  rows: readonly AccountRow[];
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (patch: Partial<Filters>) => void;
}

/** Diretório administrativo; busca pessoal é estado local e nunca é passada a onChange.
 * O consumidor preserva a busca ao atualizar dados por filtros públicos.
 * @example <AccountsDirectoryView rows={rows} search="" onSearchChange={setSearch} {...filters} onChange={setFilters} />
 */
export function AccountsDirectoryView({
  rows,
  type,
  status,
  stripeStatus,
  page,
  search,
  onSearchChange,
  onChange,
}: DirectoryProps) {
  const statusId = useId();
  const stripeId = useId();
  const filtered = filterAccounts(rows, search, status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const columns: AdminTableColumn<AccountRow>[] = [
    {
      key: "name",
      label: copy.name,
      render: (row) => row.fullName,
      compare: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    { key: "email", label: copy.email, render: (row) => row.email },
    {
      key: "cpf",
      label: copy.cpf,
      render: (row) => (row.cpfDigits ? `***.***.***-${row.cpfDigits.slice(-2)}` : copy.unavailable),
    },
    {
      key: "status",
      label: copy.statusLabel,
      render: (row) => <StatusPill label={copy.status[row.status]} size="sm" />,
    },
    { key: "created", label: copy.created, render: (row) => new Date(row.createdAt).toLocaleDateString("pt-BR") },
  ];
  if (type === "hosts")
    columns.push(
      {
        key: "person",
        label: copy.personType,
        render: (row) =>
          row.personType
            ? `${copy.person[row.personType]}${row.tradeName ? `: ${row.tradeName}` : ""}`
            : copy.unavailable,
      },
      {
        key: "stripe",
        label: copy.stripeLabel,
        render: (row) => (row.stripeStatus ? copy.stripe[row.stripeStatus] : copy.unavailable),
      },
      { key: "payouts", label: copy.receives, render: (row) => (row.payoutsEnabled ? copy.yes : copy.no) },
    );
  function clear() {
    onSearchChange("");
    onChange({ status: "all", stripeStatus: "all", page: 1 });
  }
  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      <Typography component="h1" variant="h4">
        {copy.title}
      </Typography>
      <Tabs
        value={type}
        onChange={(_, value: "owners" | "hosts") => {
          onSearchChange("");
          onChange({ type: value, status: "all", stripeStatus: "all", page: 1 });
        }}
        aria-label={copy.type}
      >
        <Tab label={copy.owners} value="owners" />
        <Tab label={copy.hosts} value="hosts" />
      </Tabs>
      <TextField
        label={copy.search}
        value={search}
        onChange={(event) => {
          onSearchChange(event.target.value);
          if (page !== 1) onChange({ page: 1 });
        }}
        autoComplete="off"
        helperText={copy.privacySearch}
      />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box>
          <Box component="label" htmlFor={statusId} sx={{ mr: 1 }}>
            {copy.statusLabel}
          </Box>
          <Box
            component="select"
            id={statusId}
            value={status}
            onChange={(event) =>
              onChange({ status: accountsSearchSchema.shape.status.parse(event.target.value), page: 1 })
            }
            sx={{ minHeight: 44, font: "inherit", maxWidth: "100%" }}
          >
            {["all", "active", "inactive", "suspended", "released"].map((value) => (
              <option key={value} value={value}>
                {value === "all" ? copy.all : copy.status[value as AccountRow["status"]]}
              </option>
            ))}
          </Box>
        </Box>
        {type === "hosts" && (
          <Box>
            <Box component="label" htmlFor={stripeId} sx={{ mr: 1 }}>
              {copy.stripeLabel}
            </Box>
            <Box
              component="select"
              id={stripeId}
              value={stripeStatus}
              onChange={(event) =>
                onChange({ stripeStatus: accountsSearchSchema.shape.stripeStatus.parse(event.target.value), page: 1 })
              }
              sx={{ minHeight: 44, font: "inherit", maxWidth: "100%" }}
            >
              <option value="all">{copy.all}</option>
              {stripeStatusSchema.options.map((value) => (
                <option key={value} value={value}>
                  {copy.stripe[value]}
                </option>
              ))}
            </Box>
          </Box>
        )}
      </Stack>
      <AdminDataTable
        key={type}
        label={copy.title}
        rows={filtered}
        columns={columns}
        rowKey={(row) => row.id}
        rowHref={(row) => `/admin/users/${row.kind}/${row.id}`}
        page={page}
        onPageChange={(next) => onChange({ page: next })}
        empty={
          <EmptyState
            title={copy.empty}
            illustration={<span />}
            action={<Button onClick={clear}>{copy.clear}</Button>}
          />
        }
      />
      {filtered.length > 0 && (search || status !== "all" || stripeStatus !== "all") && (
        <Button onClick={clear}>{copy.clear}</Button>
      )}
    </Stack>
  );
}

/** Fila de contas hidratada por conta administrativa, sem consulta pessoal no cache/URL.
 * @example <AccountsDirectory accountId={admin.id} />
 */
export function AccountsDirectory({ accountId }: { accountId: string }) {
  const [filters, setFilters] = useSearchParamsState(accountsSearchSchema);
  const [search, setSearch] = useState("");
  const owners = useQuery({ ...adminOwnerQueries.list(accountId), enabled: filters.type === "owners" });
  const hosts = useQuery({
    ...adminHostQueries.list(accountId, filters.stripeStatus === "all" ? undefined : filters.stripeStatus),
    enabled: filters.type === "hosts",
  });
  const query = filters.type === "owners" ? owners : hosts;
  if (query.isPending) return <SniffLoader />;
  if (query.isError)
    return (
      <ErrorState title={translateError(query.error, { adminAccounts: true })} onRetry={() => void query.refetch()} />
    );
  const rows =
    filters.type === "owners"
      ? (owners.data ?? []).map((value) => toAccountRow({ kind: "owners", value }))
      : (hosts.data ?? []).map((value) => toAccountRow({ kind: "hosts", value }));
  return (
    <AccountsDirectoryView rows={rows} {...filters} search={search} onSearchChange={setSearch} onChange={setFilters} />
  );
}
