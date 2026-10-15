import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import type { BookingStatus } from "../types";
import { bookingDtoSchema, bookingPageSchema } from "./contracts";
import { toBooking, toBookingPage } from "./mappers";

type Transport = Pick<HttpTransport, "request">;

/** Filtro da lista: só estes status, e a página (a partir de 1). */
export interface BookingFilters {
  statuses: readonly BookingStatus[];
  page?: number;
}

/** Tamanho da página das listas de estadias. */
const PAGE_SIZE = 20;

/**
 * Reservas por conta (specs 050 a 054): `all` é a raiz; as decisões gravam o detalhe e invalidam todas as listas
 * (`lists`), porque uma reserva muda de aba. O transporte vem de fora: `bffClient` no navegador, `backendForRequest` no
 * prefetch.
 *
 * @example useQuery(bookingQueries.mine(user.id, { statuses: ["requested"] }))
 * @example useQuery(bookingQueries.detail(user.id, bookingId))
 * @example useInfiniteQuery(bookingQueries.infinite(user.id, ["completed"]))
 */
export const bookingQueries = {
  all: (accountId: string) => accountQueryKey(accountId, "bookings"),
  lists: (accountId: string) => [...bookingQueries.all(accountId), "mine"] as const,
  mine: (accountId: string, { statuses, page = 1 }: BookingFilters, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...bookingQueries.lists(accountId), [...statuses], page] as const,
      queryFn: async () =>
        toBookingPage(
          await transport.request(
            { method: "GET", path: "/bookings/me", query: { status: [...statuses], page, pageSize: PAGE_SIZE } },
            bookingPageSchema,
          ),
        ),
    }),
  /** A mesma lista, página a página ("Mostrar mais", REQ-STAYS-003). */
  infinite: (
    accountId: string,
    statuses: readonly BookingStatus[],
    pageSize: number = PAGE_SIZE,
    transport: Transport = bffClient,
  ) =>
    infiniteQueryOptions({
      queryKey: [...bookingQueries.lists(accountId), "infinite", [...statuses], pageSize] as const,
      queryFn: async ({ pageParam }) =>
        toBookingPage(
          await transport.request(
            { method: "GET", path: "/bookings/me", query: { status: [...statuses], page: pageParam, pageSize } },
            bookingPageSchema,
          ),
        ),
      initialPageParam: 1,
      getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    }),
  detail: (accountId: string, bookingId: string, transport: Transport = bffClient) =>
    queryOptions({
      queryKey: [...bookingQueries.all(accountId), "detail", bookingId] as const,
      queryFn: async () =>
        toBooking(
          await transport.request(
            { method: "GET", path: `/bookings/${encodeURIComponent(bookingId)}` },
            bookingDtoSchema,
          ),
        ),
    }),
};
