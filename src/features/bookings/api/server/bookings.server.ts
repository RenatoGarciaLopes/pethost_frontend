import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { backendForRequest } from "@/shared/api/server/backendForRequest";
import type { Booking } from "../../types";
import { bookingQueries } from "../queries";

/**
 * Quantos pedidos esperam resposta do anfitrião (REQ-HREQ-001), para o painel `/host`. Falha conta como zero: o painel
 * não cai por causa do contador.
 *
 * @example const waiting = await countWaitingRequests(user.id);
 */
export async function countWaitingRequests(accountId: string): Promise<number> {
  try {
    const page = await createQueryClient().fetchQuery(
      bookingQueries.mine(accountId, { statuses: ["requested"] }, await backendForRequest()),
    );
    return page.totalCount;
  } catch {
    return 0;
  }
}

/**
 * Uma reserva da conta, uma busca por requisição (`cache()`). De outra conta ou inexistente vira o 404 da casca, sem dizer
 * se o id existe.
 *
 * @example const booking = await getBookingDetail(user.id, bookingId);
 */
export const getBookingDetail = cache(async (accountId: string, bookingId: string): Promise<Booking> => {
  try {
    return await createQueryClient().fetchQuery(bookingQueries.detail(accountId, bookingId, await backendForRequest()));
  } catch (error) {
    if (isApiError(error) && (error.code === "BOOKING_NOT_FOUND" || error.status === 404)) notFound();
    throw error;
  }
});
