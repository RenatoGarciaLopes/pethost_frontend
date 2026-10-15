import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { HostListingProfile, Listing, MyListings } from "../../types";
import { listingQueries } from "../queries";

/**
 * Os cantinhos do anfitrião, uma busca por requisição (`cache()`): painel, gate do cadastro e prefetch dividem o mesmo
 * `GET /listings/me`. Chame depois de `requireRole("host")`.
 * @example const mine = await getMyListings(user.id);
 */
export const getMyListings = cache(async (accountId: string): Promise<MyListings> =>
  createQueryClient().fetchQuery(listingQueries.mine(accountId, await backendForRequest())),
);

/**
 * O perfil do anfitrião para o cantinho (empresa? recebimento?), uma busca por requisição. `null` quando a conta ainda
 * não é anfitriã verificada (`404 HOST_NOT_FOUND`).
 * @example const profile = await getHostListingProfile(user.id);
 */
export const getHostListingProfile = cache(async (accountId: string): Promise<HostListingProfile | null> => {
  try {
    return await createQueryClient().fetchQuery(listingQueries.host(accountId, await backendForRequest()));
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
});

/**
 * Um cantinho do dono, uma busca por requisição. De outra conta ou inexistente vira o 404 da casca, sem dizer se o id
 * existe.
 * @example const listing = await getListingDetail(user.id, listingId);
 */
export const getListingDetail = cache(async (accountId: string, listingId: string): Promise<Listing> => {
  try {
    return await createQueryClient().fetchQuery(listingQueries.detail(accountId, listingId, await backendForRequest()));
  } catch (error) {
    if (isApiError(error) && (error.code === "LISTING_NOT_FOUND" || error.status === 404)) notFound();
    throw error;
  }
});
