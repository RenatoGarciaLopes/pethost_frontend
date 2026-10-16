import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient } from "@/test/render";
import { bookingDtoSchema } from "../api/contracts";
import { toBooking } from "../api/mappers";
import { bookingQueries } from "../api/queries";
import { useAcceptBooking, useCancelBooking, useCheckIn, useCheckOut, useDeclineBooking } from "./useBookingMutations";

const ACCOUNT = "account-1";
const path = `*/api/bookings/${BOOKING_ID}`;

function setup() {
  const client = createTestQueryClient();
  const detailKey = bookingQueries.detail(ACCOUNT, BOOKING_ID).queryKey;
  const requestedKey = bookingQueries.mine(ACCOUNT, { statuses: ["requested"] }).queryKey;
  const nextKey = bookingQueries.mine(ACCOUNT, { statuses: ["accepted", "confirmed"] }).queryKey;
  client.setQueryData(detailKey, toBooking(bookingDtoSchema.parse(bookingDto())));
  client.setQueryData(requestedKey, { items: [], page: 1, totalCount: 1, totalPages: 1 });
  client.setQueryData(nextKey, { items: [], page: 1, totalCount: 0, totalPages: 1 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const view = renderHook(
    () => ({
      accept: useAcceptBooking(ACCOUNT, BOOKING_ID),
      decline: useDeclineBooking(ACCOUNT, BOOKING_ID),
      cancel: useCancelBooking(ACCOUNT, BOOKING_ID),
      checkIn: useCheckIn(ACCOUNT, BOOKING_ID),
      checkOut: useCheckOut(ACCOUNT, BOOKING_ID),
    }),
    { wrapper },
  );
  return { ...view, client, detailKey, requestedKey, nextKey };
}

describe("useBookingMutations", () => {
  it("REQ-HREQ-008 aceitar grava a resposta no detalhe e invalida as listas (as duas abas mudam)", async () => {
    server.use(
      http.post(`${path}/acceptance`, () => HttpResponse.json(apiOk(bookingDto({ status: "confirmed" })))),
      http.get("*/api/bookings/me", () =>
        HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 20, totalCount: 0 })),
      ),
    );
    const { result, client, detailKey, requestedKey, nextKey } = setup();
    await act(() => result.current.accept.mutateAsync());
    expect(client.getQueryData(detailKey)?.status).toBe("confirmed");
    expect(client.getQueryState(requestedKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(nextKey)?.isInvalidated).toBe(true);
  });

  it("REQ-HREQ-006 pedido já respondido recarrega o detalhe para mostrar o status atual", async () => {
    server.use(
      http.post(`${path}/refusal`, () => HttpResponse.json(apiFail("BOOKING_NOT_AWAITING_RESPONSE"), { status: 422 })),
      http.get(path, () => HttpResponse.json(apiOk(bookingDto({ status: "cancelled" })))),
      http.get("*/api/bookings/me", () =>
        HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 20, totalCount: 0 })),
      ),
    );
    const { result, client, detailKey } = setup();
    await act(async () => {
      await expect(result.current.decline.mutateAsync("")).rejects.toMatchObject({
        code: "BOOKING_NOT_AWAITING_RESPONSE",
      });
    });
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
  });

  it("REQ-STDAY-002 REQ-STDAY-004 chegada e volta gravam a resposta", async () => {
    server.use(
      http.post(`${path}/check-in`, () => HttpResponse.json(apiOk(bookingDto({ status: "in_progress" })))),
      http.post(`${path}/check-out`, () => HttpResponse.json(apiOk(bookingDto({ status: "completed" })))),
      http.post(`${path}/cancellation`, () => HttpResponse.json(apiOk(bookingDto({ status: "cancelled" })))),
      http.get("*/api/bookings/me", () =>
        HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 20, totalCount: 0 })),
      ),
    );
    const { result, client, detailKey } = setup();
    await act(() => result.current.checkIn.mutateAsync());
    expect(client.getQueryData(detailKey)?.status).toBe("in_progress");
    await act(() => result.current.checkOut.mutateAsync());
    expect(client.getQueryData(detailKey)?.status).toBe("completed");
    await act(() => result.current.cancel.mutateAsync("Imprevisto"));
    expect(client.getQueryData(detailKey)?.status).toBe("cancelled");
  });
});
