"use client";

import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
import { useAcceptBooking, useCancelBooking, useDeclineBooking } from "../../hooks/useBookingMutations";
import { bookingCopy } from "../../lib/bookingCopy";
import { formatPeriod } from "../../lib/formatStay";
import type { Booking } from "../../types";

const REASON_MAX = 500;
const names = new Intl.ListFormat("pt-BR", { type: "conjunction" });

interface DecisionProps {
  accountId: string;
  booking: Booking;
}

/**
 * "Aceitar" (REQ-HREQ-004): confirma dizendo o que acontece; ao dar certo, o detalhe mostra "Estadia confirmada!" e o
 * telefone do tutor. Erros viram frase dentro do diálogo (REQ-HREQ-006).
 *
 * @example <AcceptDialog accountId={user.id} booking={booking} onAccepted={() => setJustConfirmed(true)} />
 */
export function AcceptDialog({ accountId, booking, onAccepted }: DecisionProps & { onAccepted: () => void }) {
  const copy = bookingCopy.accept;
  const accept = useAcceptBooking(accountId, booking.id);
  const [open, setOpen] = useState(false);
  const pets = names.format(booking.pets.map((pet) => pet.name ?? bookingCopy.unknownPet));
  return (
    <>
      <Button variant="contained" color="success" fullWidth onClick={() => setOpen(true)}>
        {copy.open}
      </Button>
      <ConfirmDialog
        open={open}
        title={copy.title}
        message={copy.message(pets, formatPeriod(booking.checkIn, booking.checkOut))}
        confirmLabel={copy.confirm}
        cancelLabel={copy.keep}
        busy={accept.isPending}
        error={accept.isError ? getErrorMessage(accept.error) : null}
        onConfirm={() =>
          accept.mutate(undefined, {
            onSuccess: () => {
              setOpen(false);
              onAccepted();
            },
          })
        }
        onCancel={() => {
          accept.reset();
          setOpen(false);
        }}
      />
    </>
  );
}

/**
 * "Não posso receber" (REQ-HREQ-005): confirmação neutra, com motivo opcional (até 500) e chips de atalho. Nenhuma cor de
 * erro: só o erro da API, se houver.
 *
 * @example <DeclineDialog accountId={user.id} booking={booking} />
 */
export function DeclineDialog({ accountId, booking }: DecisionProps) {
  const copy = bookingCopy.decline;
  const decline = useDeclineBooking(accountId, booking.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <>
      <Button variant="quiet" onClick={() => setOpen(true)}>
        {copy.open}
      </Button>
      <ConfirmDialog
        open={open}
        title={copy.title}
        message={copy.message}
        confirmLabel={copy.confirm}
        cancelLabel={copy.keep}
        busy={decline.isPending}
        error={decline.isError ? getErrorMessage(decline.error) : null}
        onConfirm={() => decline.mutate(reason, { onSuccess: () => setOpen(false) })}
        onCancel={() => {
          decline.reset();
          setOpen(false);
        }}
      >
        <Stack spacing={2} sx={{ mt: 2 }}>
          <ChipPicker
            label={copy.chipsLabel}
            options={copy.chips}
            selected={copy.chips.filter((chip) => chip === reason)}
            onPick={setReason}
          />
          <TextField
            label={copy.reason}
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX))}
            helperText={copy.reasonHelp}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </ConfirmDialog>
    </>
  );
}

/**
 * "Cancelar estadia" do anfitrião (REQ-HREQ-007): confirmação dizendo que o tutor recebe o valor de volta, inteiro.
 * @example <CancelBookingDialog accountId={user.id} booking={booking} />
 */
export function CancelBookingDialog({ accountId, booking }: DecisionProps) {
  const copy = bookingCopy.cancel;
  const cancel = useCancelBooking(accountId, booking.id);
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Button variant="quiet" onClick={() => setOpen(true)}>
        {copy.open}
      </Button>
      <ConfirmDialog
        open={open}
        title={copy.title}
        message={copy.message}
        confirmLabel={copy.confirm}
        cancelLabel={copy.keep}
        busy={cancel.isPending}
        error={cancel.isError ? getErrorMessage(cancel.error) : null}
        onConfirm={() => cancel.mutate("", { onSuccess: () => setOpen(false) })}
        onCancel={() => {
          cancel.reset();
          setOpen(false);
        }}
      />
    </Box>
  );
}
