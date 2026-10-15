"use client";

import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { useFlashMessage } from "@/shared/hooks/useFlashMessage";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { useDeactivatePet } from "../../hooks/usePetMutations";
import { petEditCopy } from "../../lib/petEditCopy";

const copy = petEditCopy.deactivate;
const MY_PETS_PATH = "/pets";

/**
 * "Tirar da lista" (REQ-PEDIT-011, 012): link discreto que abre a confirmação neutra, sem perguntar o motivo.
 * Deu certo: volta para "Meus pets" com o aviso "A ficha de {nome} saiu da lista." (em memória, nunca na URL).
 *
 * @example <DeactivatePetDialog accountId={user.id} petId={pet.id} name="Thor" />
 */
export function DeactivatePetDialog({ accountId, petId, name }: { accountId: string; petId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const deactivate = useDeactivatePet(accountId, petId);
  const flash = useFlashMessage();
  const router = useRouter();

  return (
    <>
      <Button
        variant="text"
        onClick={() => {
          deactivate.reset();
          setOpen(true);
        }}
        sx={{ alignSelf: "flex-start", color: "text.secondary" }}
      >
        {copy.open}
      </Button>
      <ConfirmDialog
        open={open}
        title={copy.title(name)}
        message={copy.message(name)}
        confirmLabel={copy.confirm}
        cancelLabel={copy.cancel}
        busy={deactivate.isPending}
        error={deactivate.isError ? getErrorMessage(deactivate.error) : null}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          deactivate.mutate(undefined, {
            onSuccess: () => {
              flash.show(copy.done(name));
              router.push(MY_PETS_PATH);
            },
          })
        }
      />
    </>
  );
}
