"use client";

import { Box, Button, TextField } from "@mui/material";
import { useState } from "react";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { useCancelBooking } from "../../hooks/useBookingMutations";
import { bookingCopy } from "../../lib/bookingCopy";
import type { Booking } from "../../types";

const copy = bookingCopy.cancelStay;
const REASON_MAX = 500;

export interface CancelStayDialogProps {
  accountId: string;
  booking: Booking;
  /** A estadia mudou ao mesmo tempo (409): o detalhe recarrega e mostra o aviso, já que o diálogo pode sumir. */
  onConflict: (message: string) => void;
}

/**
 * "Cancelar estadia" do tutor (spec 052, REQ-STAYS-006 e 007): só em `requested` e `confirmed` (quem chama decide),
 * confirmação neutra com motivo opcional (até 500). Erro vira frase dentro do diálogo; estadia mudada recarrega.
 * A regra do reembolso (48 horas) só entra quando houver pagamento (051).
 *
 * @example <CancelStayDialog accountId={user.id} booking={booking} onConflict={setNotice} />
 */
export function CancelStayDialog({ accountId, booking, onConflict }: CancelStayDialogProps) {
  const cancel = useCancelBooking(accountId, booking.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Box>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        {copy.open}
      </Button>
      <ConfirmDialog
        open={open}
        title={copy.title}
        message={booking.status === "confirmed" ? copy.confirmed : copy.requested}
        confirmLabel={copy.confirm}
        cancelLabel={copy.keep}
        busy={cancel.isPending}
        error={cancel.isError ? getErrorMessage(cancel.error) : null}
        onConfirm={async () => {
          // mutateAsync: a estadia cancelada ou mudada deixa de ser cancelável e o diálogo some; a promessa resolve mesmo assim.
          try {
            await cancel.mutateAsync(reason);
            setOpen(false);
          } catch (error) {
            if (!hasErrorCode(error, "BOOKING_CONFLICT")) return;
            setOpen(false);
            onConflict(getErrorMessage(error));
          }
        }}
        onCancel={() => {
          cancel.reset();
          setOpen(false);
        }}
      >
        <TextField
          label={copy.reason}
          value={reason}
          onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX))}
          helperText={copy.reasonHelp}
          multiline
          minRows={2}
          fullWidth
          sx={{ mt: 2 }}
        />
      </ConfirmDialog>
    </Box>
  );
}
