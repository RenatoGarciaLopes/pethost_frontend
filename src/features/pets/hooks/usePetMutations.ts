"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePet, deactivatePet, reactivatePet } from "../api/client/petMutations.client";
import { petQueries } from "../api/queries";
import { toPetDetail } from "../api/toPetDetail";
import type { PetDto } from "../api/contracts";
import { invalidatePetLists } from "../api/invalidatePetLists";

function usePetSuccess(accountId: string, petId: string) {
  const client = useQueryClient();
  return async (dto: PetDto) => {
    client.setQueryData(petQueries.detail(accountId, petId).queryKey, toPetDetail(dto));
    // A lista precisa atualizar; o detalhe já veio inteiro na resposta da mutation.
    await invalidatePetLists(client, accountId, dto);
  };
}
/** Salva edição e atualiza cache da conta. @example useUpdatePet(accountId, petId).mutate(body) */
export function useUpdatePet(accountId: string, petId: string) {
  return useMutation({
    mutationFn: (body: Parameters<typeof updatePet>[1]) => updatePet(petId, body),
    retry: false,
    onSuccess: usePetSuccess(accountId, petId),
  });
}
/** Retira pet da lista; navegação pertence à tela. @example useDeactivatePet(accountId, petId).mutate() */
export function useDeactivatePet(accountId: string, petId: string) {
  return useMutation({
    mutationFn: () => deactivatePet(petId),
    retry: false,
    onSuccess: usePetSuccess(accountId, petId),
  });
}
/** Reativa e preserva conflitos de microchip. @example useReactivatePet(accountId, petId).mutate() */
export function useReactivatePet(accountId: string, petId: string) {
  return useMutation({
    mutationFn: () => reactivatePet(petId),
    retry: false,
    onSuccess: usePetSuccess(accountId, petId),
  });
}
