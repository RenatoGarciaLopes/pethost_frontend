import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { PetDetail } from "../../types";
import { petQueries } from "../queries";

/**
 * A ficha de um pet da conta, uma busca por requisição (`cache()`): os metadados da página ("{nome} · Meus pets")
 * e o prefetch dividem o mesmo `GET /pets/{petId}`. Pet de outra conta ou inexistente vira o 404 da casca, sem
 * dizer se o id existe (REQ-PEDIT-002). Chame depois de `requirePersonalUser`.
 *
 * @example const pet = await getPetDetail(user.id, petId);
 */
export const getPetDetail = cache(async (accountId: string, petId: string): Promise<PetDetail> => {
  try {
    return await createQueryClient().fetchQuery(petQueries.detail(accountId, petId, await backendForRequest()));
  } catch (error) {
    if (isApiError(error) && (error.code === "PET_NOT_FOUND" || error.status === 403)) notFound();
    throw error;
  }
});

/**
 * Prefetch da ficha para o `HydrationBoundary`: a ficha e a edição abrem prontas, sem loader.
 * @example const pet = await prefetchPetDetail(queryClient, user.id, petId);
 */
export async function prefetchPetDetail(
  queryClient: QueryClient,
  accountId: string,
  petId: string,
): Promise<PetDetail> {
  const detail = await getPetDetail(accountId, petId);
  queryClient.setQueryData(petQueries.detail(accountId, petId).queryKey, detail);
  return detail;
}
