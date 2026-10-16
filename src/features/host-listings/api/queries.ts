import { queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { hostMeSchema, listingDtoSchema, myListingsSchema } from "./contracts";
import { toHostListingProfile, toListing, toMyListings } from "./mappers";

type Transport = Pick<HttpTransport, "request">;

/**
 * Consultas do cantinho por conta (spec 044). `all` é a raiz; as mutações gravam o detalhe e invalidam `mine`. `host`
 * lê o perfil do anfitrião (`GET /hosts/me`) para saber se é empresa e se o recebimento está liberado, sem depender da
 * feature do Stripe (043). O transporte vem de fora: `bffClient` no navegador, `backendForRequest` no prefetch.
 *
 * @example useQuery(listingQueries.mine(user.id))
 * @example useQuery(listingQueries.detail(user.id, listingId))
 */
export const listingQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "listings"),
  mine: (accountId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...listingQueries.all(accountId), "mine"] as const,
      queryFn: async () =>
        toMyListings(await transport.request({ method: "GET", path: "/listings/me" }, myListingsSchema)),
    }),
  detail: (accountId: string, listingId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...listingQueries.all(accountId), "detail", listingId] as const,
      queryFn: async () =>
        toListing(
          await transport.request(
            { method: "GET", path: `/listings/${encodeURIComponent(listingId)}` },
            listingDtoSchema,
          ),
        ),
    }),
  host: (accountId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...listingQueries.all(accountId), "host"] as const,
      queryFn: async () =>
        toHostListingProfile(await transport.request({ method: "GET", path: "/hosts/me" }, hostMeSchema)),
    }),
};
