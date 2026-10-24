import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { GetApiV1HostsMeResponse } from "@/shared/api/generated/hosts/hosts.zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { listingPageQueries } from "../queries";
import { listingBlocksSchema, listingReviewsSchema, type ListingReview } from "../contracts";
import type { ListingClosedPeriod } from "../../lib/listingClosedDays";

/** Quantas avaliações a página mostra (as mais novas). */
const REVIEWS_SHOWN = 4;

/** Carrega detalhe por conta e request; oculta listing ausente, inativo ou indisponível no mesmo 404. */
export const getListingPageDetail = cache(async (accountId: string, listingId: string) => {
  try {
    return await createQueryClient().fetchQuery(
      listingPageQueries.detail(accountId, listingId, await backendForRequest()),
    );
  } catch (error) {
    if (isApiError(error) && (error.code === "LISTING_NOT_FOUND" || error.status === 404)) notFound();
    throw error;
  }
});

/** Identifica com segurança o perfil anfitrião da sessão atual. Visitante (`accountId` "visitor") nunca é o dono. */
export const getListingPageContext = cache(
  async (accountId: string, role: "owner" | "host" | "visitor", listingId: string) => {
    const listing = await getListingPageDetail(accountId, listingId);
    const transport = await backendForRequest();
    const hostProfile =
      role === "host"
        ? await transport.request({ method: "GET", path: "/hosts/me" }, unwrapData(GetApiV1HostsMeResponse))
        : null;
    return { listing, isOwner: role === "host" && hostProfile?.id === listing.hostId };
  },
);

/**
 * Os períodos que o anfitrião fechou na agenda (`GET /listings/{id}/availability-blocks`, exige conta: só com sessão).
 * Falha não derruba a página nem o pedido: o calendário fica só com os dias da semana, e a API segue barrando no envio.
 * @example const blocks = user ? await getListingClosedPeriods(listing.id) : []
 */
export const getListingClosedPeriods = cache(async (listingId: string): Promise<ListingClosedPeriod[]> => {
  try {
    const transport = await backendForRequest();
    const blocks = await transport.request(
      { method: "GET", path: `/listings/${listingId}/availability-blocks` },
      listingBlocksSchema,
    );
    return blocks.map(({ startDate, endDate }) => ({ startDate, endDate }));
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error(
        "ListingClosedPeriods",
        isApiError(error) ? { status: error.status, code: error.code } : { code: "UNKNOWN_ERROR" },
      );
    return [];
  }
});

/**
 * As avaliações mais novas dos tutores sobre o cantinho (`GET /reviews?listingId=`, pública). Falha não derruba a
 * página: a seção some, como sem avaliação.
 * @example const reviews = await getListingReviews(listing.id)
 */
export const getListingReviews = cache(async (listingId: string): Promise<ListingReview[]> => {
  try {
    const transport = await backendForRequest();
    const page = await transport.request(
      // Nomes dos parâmetros como no contrato (GetApiV1ReviewsQueryParams).
      { method: "GET", path: "/reviews", query: { ListingId: listingId, Page: 1, PageSize: REVIEWS_SHOWN } },
      listingReviewsSchema,
    );
    return page.items;
  } catch (error) {
    if (process.env.NODE_ENV === "development")
      console.error(
        "ListingReviews",
        isApiError(error) ? { status: error.status, code: error.code } : { code: "UNKNOWN_ERROR" },
      );
    return [];
  }
});
