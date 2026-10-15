"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminOwnerQueries, type AdminOwner } from "@/features/owners";
import { adminHostQueries, type AdminHost } from "@/features/hosts";
import { getOwner } from "@/features/owners/index.client";
import { getHost } from "@/features/hosts/index.client";
import { isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { useAccountAction } from "../hooks/useAccountAction";
import { toAccountRow, type AccountKind, type AccountSource } from "../lib/accountRows";
import { accountsCopy as copy } from "../lib/accountsCopy";
import { AccountSummary } from "./AccountSummary";
import { AccountActions } from "./AccountActions";

interface DetailProps {
  /** Identificador do admin para isolar a cache desta sessão. */
  accountId: string;
  /** ownerId ou hostId conforme kind. */
  resourceId: string;
  /** Seleciona contrato, cliente, chaves e parâmetro da auditoria. */
  kind: AccountKind;
  /** Slot opcional preenchido pela composição da auditoria (033). */
  auditTrail?: ReactNode;
}
/** Detalhe de conta, ações e slot de auditoria da 033. O slot não faz consulta nem invalidação aqui.
 * Rotas chamam após requireRole(admin) e prefetch. CPF/CNPJ nunca vão à URL da trilha.
 * @example <AccountDetail accountId={admin.id} resourceId={owner.id} kind="owners" auditTrail={<AuditTable />} />
 */
export function AccountDetail({ accountId, resourceId, kind, auditTrail }: DetailProps) {
  const keys = kind === "owners" ? adminOwnerQueries : adminHostQueries;
  const query = useQuery<AdminOwner | AdminHost>({
    queryKey: keys.detail(accountId, resourceId).queryKey,
    queryFn: ({ signal }) =>
      kind === "owners" ? getOwner(resourceId, undefined, signal) : getHost(resourceId, undefined, signal),
    staleTime: 30_000,
  });
  const mutation = useAccountAction(accountId, kind, resourceId);
  if (query.isPending) return <SniffLoader />;
  if (query.isError)
    return (
      <ErrorState title={getErrorMessage(query.error, { adminAccounts: true })} onRetry={() => void query.refetch()} />
    );
  const source: AccountSource =
    "personType" in query.data ? { kind: "hosts", value: query.data } : { kind: "owners", value: query.data };
  const row = toAccountRow(source);
  const audit = new URLSearchParams({ targetType: kind === "owners" ? "owner" : "host", targetId: resourceId });
  return (
    <Stack spacing={3} sx={{ py: 3 }}>
      <Link href={`/admin/users?type=${kind}`}>{copy.back}</Link>
      <AccountSummary key={resourceId} source={source} />
      <AccountActions
        key={resourceId}
        row={row}
        busy={mutation.isPending}
        onAction={mutation.mutateAsync}
        onBegin={mutation.reset}
        reasonError={isApiError(mutation.error) ? mutation.error.fieldErrors.reason?.join(" ") : undefined}
      />
      <section aria-label={copy.audit}>
        <Typography component="h2" variant="h5">
          {copy.audit}
        </Typography>
        {auditTrail}
        <Link href={`/admin/audit-entries?${audit.toString()}`}>{copy.fullAudit}</Link>
      </section>
    </Stack>
  );
}
