"use client";

import { Box, Button } from "@mui/material";
import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { useCancelApplication } from "../../../hooks/useApplicationMutations";
import { verificationCopy } from "../../../lib/verificationCopy";

const copy = verificationCopy.status.cancel;

/**
 * O "Desistir" discreto da verificação (REQ-HVER-013): pergunta antes, dizendo que as fotos são apagadas e que não
 * gasta tentativa. Confirmado, a verificação é relida e a tela mostra o estado de desistência.
 *
 * @example <CancelApplicationDialog accountId={user.id} />
 */
export function CancelApplicationDialog({ accountId }: { accountId: string }) {
  const cancel = useCancelApplication(accountId);
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
        onConfirm={() => cancel.mutate(undefined, { onSuccess: () => setOpen(false) })}
        onCancel={() => {
          cancel.reset();
          setOpen(false);
        }}
      />
    </Box>
  );
}
