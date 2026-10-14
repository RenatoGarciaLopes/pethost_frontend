"use client";

import { Box, Button, Stack } from "@mui/material";
import { useState } from "react";
import { useObjectUrl } from "@/shared/hooks/useObjectUrl";
import { Notice } from "@/shared/ui/feedback/Notice";
import { PhotoSlots } from "@/shared/ui/media/PhotoSlots";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { usePetWizard } from "../../../stores/PetWizardProvider";
import { PetProfileCard } from "../../PetProfileCard";
import { StepForm } from "./StepForm";

const copy = petWizardCopy.review;

export interface ReviewStepProps {
  onSave: () => void;
  /** Texto do botão enquanto salva ("Salvando a ficha…", "Enviando fotos (1 de 3)…"); `null` = parado. */
  progress: string | null;
  /** Alguma foto falhou depois do pet criado (REQ-PNEW-018). */
  photoFailed: boolean;
  uploadingIndex: number | null;
  onRetryPhotos: () => void;
  onSkipPhotos: () => void;
}

/**
 * Passo 7, "Confere a ficha" (REQ-PNEW-015, 016, 018): a carteirinha completa com "Editar" por bloco e
 * "Salvar a ficha de {nome}". Foto que falhou depois do pet criado: as vagas mostram o erro e a pessoa tenta
 * de novo ou segue sem (o pet nunca é recriado).
 *
 * @example <ReviewStep onSave={save} progress={null} photoFailed={false} … />
 */
export function ReviewStep({
  onSave,
  progress,
  photoFailed,
  uploadingIndex,
  onRetryPhotos,
  onSkipPhotos,
}: ReviewStepProps) {
  const values = usePetWizard((state) => state.values);
  const photos = usePetWizard((state) => state.photos);
  const photoErrors = usePetWizard((state) => state.photoErrors);
  const goTo = usePetWizard((state) => state.goTo);
  const cover = useObjectUrl(photos[0] ?? null);
  const [now] = useState(() => new Date());
  const name = values.name || petWizardCopy.fallbackName;
  const busy = progress !== null;

  return (
    <StepForm
      title={copy.title}
      nextLabel={progress ?? copy.save(name)}
      busy={busy || photoFailed}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !photoFailed) onSave();
      }}
    >
      <PetProfileCard
        values={values}
        coverUrl={cover}
        now={now}
        onEdit={busy || photoFailed ? undefined : (step) => goTo(step, { fromReview: true })}
      />
      {(photoFailed || uploadingIndex !== null) && (
        <PhotoSlots
          label={petWizardCopy.identity.photos(name)}
          files={photos}
          errors={photoErrors}
          uploadingIndex={uploadingIndex}
          disabled
          onPick={() => undefined}
          onRemove={() => undefined}
        />
      )}
      {photoFailed && (
        <Notice tone="atencao">
          <Stack spacing={1.5}>
            <Box>{petWizardCopy.photoFailed}</Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" onClick={onRetryPhotos}>
                {petWizardCopy.retryPhotos}
              </Button>
              <Button variant="text" size="small" onClick={onSkipPhotos}>
                {petWizardCopy.skipPhotos}
              </Button>
            </Stack>
          </Stack>
        </Notice>
      )}
    </StepForm>
  );
}
