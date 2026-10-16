"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createListing,
  deactivateListing,
  reactivateListing,
  updateListing,
} from "../api/client/listingMutations.client";
import type { ListingDto } from "../api/contracts";
import { toListing, type CreateListingRequest, type UpdateListingRequest } from "../api/mappers";
import { listingQueries } from "../api/queries";

/**
 * Grava o cantinho devolvido no detalhe e invalida "meus cantinhos" (REQ-LIST-016). Nada otimista: a tela só muda com
 * a resposta da API.
 * @example const onSuccess = useListingSuccess(user.id);
 */
export function useListingSuccess(accountId: string) {
  const client = useQueryClient();
  return async (dto: ListingDto) => {
    client.setQueryData(listingQueries.detail(accountId, dto.id).queryKey, toListing(dto));
    await client.invalidateQueries({ queryKey: listingQueries.mine(accountId).queryKey });
  };
}

/**
 * "Abrir meu cantinho" (REQ-LIST-011): um `POST`, sem repetir.
 * @example useCreateListing(user.id).mutate(toCreateListingRequest(values))
 */
export function useCreateListing(accountId: string) {
  return useMutation({
    mutationFn: (body: CreateListingRequest) => createListing(body),
    retry: false,
    onSuccess: useListingSuccess(accountId),
  });
}

/**
 * Salva uma seção do cantinho aberto com só o que mudou (REQ-LIST-013).
 * @example useUpdateListing(user.id, id).mutate(body)
 */
export function useUpdateListing(accountId: string, listingId: string) {
  return useMutation({
    mutationFn: (body: UpdateListingRequest) => updateListing(listingId, body),
    retry: false,
    onSuccess: useListingSuccess(accountId),
  });
}

/**
 * "Pausar meu cantinho" (REQ-LIST-015).
 * @example useDeactivateListing(user.id, id).mutate()
 */
export function useDeactivateListing(accountId: string, listingId: string) {
  return useMutation({
    mutationFn: () => deactivateListing(listingId),
    retry: false,
    onSuccess: useListingSuccess(accountId),
  });
}

/**
 * "Reabrir" o cantinho pausado (REQ-LIST-015).
 * @example useReactivateListing(user.id, id).mutate()
 */
export function useReactivateListing(accountId: string, listingId: string) {
  return useMutation({
    mutationFn: () => reactivateListing(listingId),
    retry: false,
    onSuccess: useListingSuccess(accountId),
  });
}
