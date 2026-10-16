"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import {
  addListingPhoto,
  removeListingPhoto,
  reorderListingPhotos,
  replaceListingPhoto,
} from "../api/client/listingMutations.client";
import type { ListingDto } from "../api/contracts";
import { listingQueries } from "../api/queries";
import type { Listing } from "../types";
import { useListingSuccess } from "./useListingMutations";

/** Até 5 fotos por cantinho (`modulo-listings.md` 6). */
export const MAX_LISTING_PHOTOS = 5;

/**
 * As fotos do cantinho ligadas à API (REQ-LIST-014): pôr (no fim), trocar, tirar e reordenar ("Usar como capa" e
 * mover), uma operação por vez, cada uma com o estado de envio da vaga. Erro aparece na vaga; foto que já sumiu
 * recarrega o cantinho, sem erro. A resposta vai para o detalhe e "meus cantinhos" é invalidado.
 *
 * @example const photos = useListingPhotoMutations(user.id, listing); await photos.add(listing.photos.length, file);
 */
export function useListingPhotoMutations(accountId: string, listing: Listing) {
  const client = useQueryClient();
  const onSuccess = useListingSuccess(accountId);
  const lock = useRef(false);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [errors, setErrors] = useState<readonly (string | null)[]>(() => Array(MAX_LISTING_PHOTOS).fill(null));
  const setError = (slot: number, message: string | null) =>
    setErrors((current) => current.map((value, index) => (index === slot ? message : value)));

  async function run(slot: number, send: () => Promise<ListingDto>) {
    if (lock.current) return;
    lock.current = true;
    setBusySlot(slot);
    setError(slot, null);
    try {
      await onSuccess(await send());
    } catch (error) {
      if (hasErrorCode(error, "LISTING_PHOTO_NOT_FOUND"))
        await client.invalidateQueries({ queryKey: listingQueries.detail(accountId, listing.id).queryKey });
      else setError(slot, getErrorMessage(error));
    } finally {
      lock.current = false;
      setBusySlot(null);
    }
  }

  const photoId = (slot: number) => listing.photos[slot]?.id;

  return {
    add: (slot: number, file: File) => run(slot, () => addListingPhoto(listing.id, file)),
    replace: async (slot: number, file: File) => {
      const id = photoId(slot);
      if (id) await run(slot, () => replaceListingPhoto(listing.id, id, file));
    },
    remove: async (slot: number) => {
      const id = photoId(slot);
      if (id) await run(slot, () => removeListingPhoto(listing.id, id));
    },
    move: (from: number, to: number) => {
      const ids = listing.photos.map((photo) => photo.id);
      const [moved] = ids.splice(from, 1);
      if (!moved) return Promise.resolve();
      ids.splice(to, 0, moved);
      return run(to, () => reorderListingPhotos(listing.id, ids));
    },
    busySlot,
    errors,
  };
}
