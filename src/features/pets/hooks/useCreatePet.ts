"use client";
import { useMutation } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { createPet } from "../api/client/petMutations.client";
import { toCreatePetRequest } from "../api/mappers";
import type { PetProfileValues } from "../schemas/petProfileSchema";
/** Cria a ficha; a tela invalida a lista apenas ao terminar as fotos. @example const create = useCreatePet(accountId); await create.mutateAsync(values); */
export function useCreatePet(accountId: string) {
  return useMutation({
    mutationKey: accountQueryKey(accountId, "pets", "create"),
    mutationFn: (values: PetProfileValues) => createPet(toCreatePetRequest(values)),
    retry: false,
  });
}
