import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import { GetApiV1HostsMeResponse } from "@/shared/api/generated/hosts/hosts.zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { listingPageQueries } from "../queries";

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

/** Identifica com segurança o perfil anfitrião da sessão atual. */
export const getListingPageContext = cache(async (accountId: string, role: "owner" | "host", listingId: string) => {
  const listing = await getListingPageDetail(accountId, listingId);
  const transport = await backendForRequest();
  const hostProfile =
    role === "host"
      ? await transport.request({ method: "GET", path: "/hosts/me" }, unwrapData(GetApiV1HostsMeResponse))
      : null;
  return { listing, isOwner: role === "host" && hostProfile?.id === listing.hostId };
});
