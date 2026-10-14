"use client";
import { useMutation } from "@tanstack/react-query";
import { uploadPetPhoto } from "../api/client/petMutations.client";
/** Envia uma foto; sequência, vagas e tratamento de falhas ficam com a tela. @example await useUploadPetPhoto().mutateAsync({ petId, file }); */
export function useUploadPetPhoto() {
  return useMutation({
    mutationFn: ({ petId, file }: { petId: string; file: File }) => uploadPetPhoto(petId, file),
    retry: false,
  });
}
