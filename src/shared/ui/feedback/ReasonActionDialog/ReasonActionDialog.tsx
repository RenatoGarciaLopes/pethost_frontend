"use client";
import { useId, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { ReasonField } from "../../forms/ReasonField";
import { Notice } from "../Notice";
import { reasonSchema } from "../../../lib/validation/reasonSchema";
/** Diálogo controlado: o domínio fornece texto, efeito e ação; não faz HTTP.
 * @example const props: ReasonActionDialogProps = { open: true, title: "Suspender", effect: "A pessoa sai da conta", confirmLabel: "Suspender", cancelLabel: "Cancelar", onConfirm: body => save(body), onCancel: close };
 */
export interface ReasonActionDialogProps {
  /** Controla montagem e visibilidade do diálogo. */
  open: boolean;
  /** Título também usado como nome acessível. */
  title: string;
  /** Efeito da operação que será confirmado. */
  effect: string;
  /** Texto da ação principal. */
  confirmLabel: string;
  /** Texto para cancelar e devolver o foco à origem. */
  cancelLabel: string;
  /** reason pede nota 1..500; confirmation não inventa corpo para operações sem motivo. */
  mode?: "reason" | "confirmation";
  /** Rótulo do campo de motivo, no modo reason. */
  reasonLabel?: string;
  /** Orientação abaixo do motivo. */
  reasonHelp?: string;
  /** Confirmação reforçada literal, por exemplo LIBERAR. Não é enviada à API. */
  confirmationWord?: string;
  /** Rótulo mostrado acima do campo de confirmação literal. */
  confirmationLabel?: string;
  /** Desabilita controles enquanto a ação está em andamento. */
  busy?: boolean;
  /** Erro da operação, exibido no diálogo. */
  error?: string;
  /** Erro de validação associado ao campo de motivo. */
  reasonError?: string;
  /** Recebe motivo validado ou objeto vazio no modo confirmation. */
  onConfirm: (body: { reason?: string }) => void;
  /** Fecha sem confirmar. */
  onCancel: () => void;
}
/** Motivo + efeito + confirmação reforçada opcional, com foco seguro, Esc e retorno à origem.
 * Monte por ação para reiniciar os campos. Para confirmação simples sem formulário use ConfirmDialog.
 * @example <ReasonActionDialog {...props} confirmationWord="LIBERAR" confirmationLabel="Digite LIBERAR" />
 */
export function ReasonActionDialog({
  open,
  title,
  effect,
  confirmLabel,
  cancelLabel,
  mode = "reason",
  reasonLabel = "Motivo",
  reasonHelp,
  confirmationWord,
  confirmationLabel,
  busy = false,
  error,
  reasonError,
  onConfirm,
  onCancel,
}: ReasonActionDialogProps) {
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const valid =
    (mode === "confirmation" || reasonSchema.safeParse({ reason }).success) &&
    (!confirmationWord || confirmation === confirmationWord);
  return (
    <Dialog
      open={open}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-effect`}
      onClose={() => {
        if (!busy) onCancel();
      }}
      slotProps={{ transition: { onEntered: () => cancelRef.current?.focus() } }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText id={`${id}-effect`}>{effect}</DialogContentText>
          {error && <Notice tone="erro">{error}</Notice>}
          {mode === "reason" && (
            <ReasonField
              label={reasonLabel}
              value={reason}
              onChange={setReason}
              helperText={reasonHelp}
              error={reasonError}
              disabled={busy}
            />
          )}
          {confirmationWord && (
            <TextField
              label={confirmationLabel ?? confirmationWord}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={busy}
              autoComplete="off"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => onConfirm(mode === "reason" ? reasonSchema.parse({ reason }) : {})}
          disabled={busy || !valid}
          aria-busy={busy || undefined}
        >
          {confirmLabel}
        </Button>
        <Button ref={cancelRef} autoFocus onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
