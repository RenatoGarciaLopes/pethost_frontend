"use client";

import { Stack, Typography } from "@mui/material";
import { Hint } from "@/shared/ui/feedback/Hint";
import { PhotoSlots } from "@/shared/ui/media/PhotoSlots";
import { MAX_LISTING_PHOTOS, useListingPhotoMutations } from "../../hooks/useListingPhotoMutations";
import { listingCopy } from "../../lib/listingCopy";
import { PHOTOS_ANCHOR } from "../../lib/listingPaths";
import type { Listing } from "../../types";

const copy = listingCopy.photos;

/**
 * "Fotos da casa" (REQ-LIST-014): até 5 vagas com as fotos salvas; pôr (no fim), trocar, tirar e reordenar ("Usar
 * como capa" e mover por botão), direto na API, uma operação por vez; a primeira é a capa. Sugestões do que fotografar.
 *
 * @example <ListingPhotosSection accountId={user.id} listing={listing} />
 */
export function ListingPhotosSection({ accountId, listing }: { accountId: string; listing: Listing }) {
  const photos = useListingPhotoMutations(accountId, listing);
  const files = Array.from({ length: MAX_LISTING_PHOTOS }, (_, slot) => listing.photos[slot]?.url ?? null);
  const nextFree = listing.photos.length;

  return (
    <Stack component="section" id={PHOTOS_ANCHOR} aria-labelledby={`${PHOTOS_ANCHOR}-titulo`} spacing={2}>
      <Typography id={`${PHOTOS_ANCHOR}-titulo`} variant="h2" sx={{ fontSize: { xs: 22, md: 26 } }}>
        {copy.heading}
      </Typography>
      <Typography color="text.secondary">{copy.help}</Typography>
      <Hint title={copy.suggestionsTitle}>{copy.suggestions.join(" · ")}</Hint>
      <PhotoSlots
        label={copy.label}
        files={files}
        errors={photos.errors}
        uploadingIndex={photos.busySlot}
        // A API põe a foto nova no fim: a vaga escolhida não importa.
        onPick={(_, file) => void photos.add(nextFree, file)}
        onReplace={(slot, file) => void photos.replace(slot, file)}
        onRemove={(slot) => void photos.remove(slot)}
        onMove={(from, to) => void photos.move(from, to)}
      />
    </Stack>
  );
}
