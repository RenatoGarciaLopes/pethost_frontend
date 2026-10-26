import "server-only";
import type { QueryClient } from "@tanstack/react-query";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { SearchPet, SearchQuery } from "../../types";
import { toSearchError } from "../../lib/searchErrors";
import { searchQueries } from "../queries";

/** Prefetch hidratável; erros conhecidos se tornam estado serializável sem exception na página. @example await prefetchSearch(client, accountId, query, pets) */
export async function prefetchSearch(client: QueryClient, accountId: string, query: SearchQuery, pets: SearchPet[]) {
  try {
    await client.fetchInfiniteQuery(searchQueries.infinite(accountId, query, pets, await backendForRequest()));
  } catch (error) {
    return toSearchError(error);
  }
}

/**
 * Compatibilidade de um pet com o cantinho, pré-carregada para a `CompatibilityNotice` hidratar pronta (a caixa não
 * aparece depois, empurrando a página). Falha fica silenciosa: no navegador a caixa simplesmente não aparece.
 * @example await prefetchCompatibility(client, user.id, listing.id, pet.id, { checkIn, checkOut })
 */
export async function prefetchCompatibility(
  client: QueryClient,
  accountId: string,
  listingId: string,
  petId: string,
  stay: { checkIn?: string; checkOut?: string },
) {
  await client.prefetchQuery(searchQueries.compatibility(accountId, listingId, petId, stay, await backendForRequest()));
}
