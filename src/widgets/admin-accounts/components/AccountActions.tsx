"use client";
import { useRef, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import { ReasonActionDialog } from "@/shared/ui/feedback/ReasonActionDialog";
import { Notice } from "@/shared/ui/feedback/Notice";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import type { AccountAction } from "../hooks/useAccountAction";
import type { AccountRow } from "../lib/accountRows";
import { accountsCopy as copy } from "../lib/accountsCopy";
interface AccountActionsProps {
  /** Dados mínimos do recurso para definir estado e ações permitidas. */
  row: AccountRow;
  /** Bloqueia ações enquanto a API responde. */
  busy: boolean;
  /** Executa a operação; deve rejeitar em falha para manter o diálogo. */
  onAction: (action: AccountAction) => unknown | Promise<unknown>;
  /** Limpa erro/cache local ao abrir uma nova operação. */
  onBegin?: () => void;
  /** Erro de campo enviado pela API após tentativa. */
  reasonError?: string;
}
/** Ações por estado, com efeito/motivo e confirmação literal para liberar documento.
 * onAction deve rejeitar em falha, para manter o diálogo e a nota. A retirada não recebe motivo.
 * @example <AccountActions row={row} busy={mutation.isPending} onAction={mutation.mutateAsync} />
 */
export function AccountActions({ row, busy, onAction, onBegin, reasonError }: AccountActionsProps) {
  const [selected, setSelected] = useState<AccountAction["action"] | null>(null);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const region = useRef<HTMLDivElement>(null);
  const allowed: AccountAction["action"][] =
    row.status === "released" ? [] : row.status === "suspended" ? ["lift", "release"] : ["suspend"];
  if (row.kind === "hosts" && row.stripeStatus === "rejected" && row.status !== "released") allowed.push("resetStripe");
  const label = (action: AccountAction["action"]) =>
    action === "release" && row.kind === "owners" ? copy.releaseCpf : copy.action[action];
  async function confirm(body: { reason?: string }) {
    if (!selected) return;
    try {
      await onAction(selected === "lift" ? { action: "lift" } : { action: selected, reason: body.reason ?? "" });
      setSuccess(copy.success[selected]);
      setSelected(null);
      queueMicrotask(() => {
        const target = region.current?.querySelector<HTMLButtonElement>("button");
        (target ?? region.current)?.focus();
      });
    } catch (cause) {
      setError(getErrorMessage(cause, { adminAccounts: true }));
    }
  }
  return (
    <Stack spacing={2}>
      {success && <Notice tone="ok">{success}</Notice>}
      {!selected && error && <Notice tone="erro">{error}</Notice>}
      {row.status === "released" && <Notice tone="info">{copy.released}</Notice>}
      <Box ref={region} tabIndex={-1} sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {allowed.map((action) => (
          <Button
            key={action}
            disabled={busy}
            onClick={() => {
              onBegin?.();
              setError(undefined);
              setSuccess(undefined);
              setSelected(action);
            }}
          >
            {label(action)}
          </Button>
        ))}
      </Box>
      {selected && (
        <ReasonActionDialog
          key={selected}
          open
          title={label(selected)}
          effect={copy.effects[selected]}
          confirmLabel={label(selected)}
          cancelLabel={copy.cancel}
          mode={selected === "lift" ? "confirmation" : "reason"}
          reasonLabel={copy.reason}
          reasonHelp={copy.reasonHelp}
          confirmationWord={selected === "release" ? copy.releaseWord : undefined}
          confirmationLabel={copy.confirmation}
          busy={busy}
          error={error}
          reasonError={reasonError}
          onConfirm={(body) => void confirm(body)}
          onCancel={() => setSelected(null)}
        />
      )}
    </Stack>
  );
}
