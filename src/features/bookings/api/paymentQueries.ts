import { queryOptions } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { bookingQueries } from "./queries";
import { paymentSchema } from "./paymentContracts";

/** Pagamento isolado por conta/reserva. Transporte injetável para prefetch e integração. */
export const paymentQuery = (
  accountId: string,
  bookingId: string,
  transport: Pick<HttpTransport, "request"> = bffClient,
) =>
  queryOptions({
    queryKey: [...bookingQueries.all(accountId), "payment", bookingId],
    queryFn: ({ signal }) =>
      transport.request(
        { method: "GET", path: `/bookings/${encodeURIComponent(bookingId)}/payment`, signal },
        paymentSchema,
      ),
  });
