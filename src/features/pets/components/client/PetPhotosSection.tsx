"use client";

import { Stack, Typography } from "@mui/material";
import { PhotoSlots } from "@/shared/ui/media/PhotoSlots";
import { usePetPhotoMutations } from "../../hooks/usePetPhotoMutations";
import { petEditCopy as copy } from "../../lib/petEditCopy";
import type { PetDetail } from "../../types";

const SLOTS = 3;

/**
 * Seção "Fotos" da edição (REQ-PEDIT-008 a 010): as vagas mostram as fotos salvas; pôr, trocar e tirar vão
 * direto para a API, uma operação por vez, e o erro aparece na vaga. A API decide a vaga de uma foto nova (a
 * primeira livre) e a capa (a primeira).
 *
 * @example <PetPhotosSection accountId={user.id} pet={pet} />
 */
export function PetPhotosSection({ accountId, pet }: { accountId: string; pet: PetDetail }) {
  const photos = usePetPhotoMutations(accountId, pet.id);
  const files = Array.from({ length: SLOTS }, (_, slot) => pet.photos[slot]?.url ?? null);
  const photoId = (slot: number) => pet.photos[slot]?.id;

  return (
    <Stack component="section" id="fotos" aria-label={copy.sections.photos} spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        {copy.photosHelp}
      </Typography>
      <PhotoSlots
        label={copy.photosLabel(pet.values.name)}
        files={files}
        errors={photos.errors}
        uploadingIndex={photos.busySlot}
        onPick={(slot, file) => void photos.add(slot, file)}
        onReplace={(slot, file) => {
          const id = photoId(slot);
          if (id) void photos.replace(slot, id, file);
        }}
        onRemove={(slot) => {
          const id = photoId(slot);
          if (id) void photos.remove(slot, id);
        }}
      />
    </Stack>
  );
}
