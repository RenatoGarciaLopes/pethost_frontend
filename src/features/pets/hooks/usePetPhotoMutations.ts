"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { uploadPetPhoto, replacePetPhoto, removePetPhoto } from "../api/client/petMutations.client";
import { petQueries } from "../api/queries";
import { toPetDetail } from "../api/toPetDetail";
import type { PetDto } from "../api/contracts";

/** Uma operação por vez; erros traduzidos por vaga e cache atualizado pela resposta. @example const photos = usePetPhotoMutations(accountId, petId); await photos.add(0, file); */
export function usePetPhotoMutations(accountId: string, petId: string) {
  const client = useQueryClient();
  const lock = useRef(false);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [errors, setErrors] = useState<readonly (string | null)[]>([null, null, null]);
  const setError = (slot: number, message: string | null) =>
    setErrors((previous) => previous.map((value, index) => (index === slot ? message : value)));
  const run = async (slot: number, send: () => Promise<PetDto>): Promise<void> => {
    if (lock.current || !Number.isInteger(slot) || slot < 0 || slot >= 3) return;
    lock.current = true;
    setBusySlot(slot);
    setError(slot, null);
    try {
      const dto = await send();
      client.setQueryData(petQueries.detail(accountId, petId).queryKey, toPetDetail(dto));
      // Só a lista está desatualizada: a resposta já contém o detalhe inteiro.
      await client.invalidateQueries({ queryKey: petQueries.mine(accountId).queryKey });
    } catch (error) {
      if (hasErrorCode(error, "PET_PHOTO_NOT_FOUND")) {
        await client.invalidateQueries({ queryKey: petQueries.detail(accountId, petId).queryKey });
      } else setError(slot, getErrorMessage(error));
    } finally {
      lock.current = false;
      setBusySlot(null);
    }
  };
  return {
    add: (slot: number, file: File) => run(slot, () => uploadPetPhoto(petId, file)),
    replace: (slot: number, photoId: string, file: File) => run(slot, () => replacePetPhoto(petId, photoId, file)),
    remove: (slot: number, photoId: string) => run(slot, () => removePetPhoto(petId, photoId)),
    busySlot,
    errors,
    clearError: (slot: number) => setError(slot, null),
  };
}
