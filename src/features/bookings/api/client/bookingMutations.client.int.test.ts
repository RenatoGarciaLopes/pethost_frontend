import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import {
  acceptBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  declineBooking,
} from "./bookingMutations.client";

const transport = createBffClient({ baseUrl: "http://localhost/api" });
const path = `*/api/bookings/${BOOKING_ID}`;

describe("bookingMutations.client", () => {
  it("REQ-HREQ-004 aceitar é um POST sem corpo e volta a reserva confirmada", async () => {
    server.use(
      http.post(`${path}/acceptance`, async ({ request }) => {
        expect(await request.text()).toBe("");
        expect(request.headers.get("x-pethost-request")).toBe("1");
        return HttpResponse.json(apiOk(bookingDto({ status: "confirmed" })));
      }),
    );
    expect((await acceptBooking(BOOKING_ID, transport)).status).toBe("confirmed");
  });

  it("REQ-HREQ-005 REQ-HREQ-007 recusar e cancelar levam o motivo quando há", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${path}/refusal`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(apiOk(bookingDto({ status: "declined" })));
      }),
      http.post(`${path}/cancellation`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(apiOk(bookingDto({ status: "cancelled" })));
      }),
    );
    await declineBooking(BOOKING_ID, "Não estarei em casa", transport);
    await cancelBooking(BOOKING_ID, "", transport);
    expect(bodies).toEqual([{ reason: "Não estarei em casa" }, {}]);
  });

  it("REQ-STDAY-002 REQ-STDAY-004 chegada e volta", async () => {
    server.use(
      http.post(`${path}/check-in`, () => HttpResponse.json(apiOk(bookingDto({ status: "in_progress" })))),
      http.post(`${path}/check-out`, () => HttpResponse.json(apiOk(bookingDto({ status: "completed" })))),
    );
    expect((await checkInBooking(BOOKING_ID, transport)).status).toBe("in_progress");
    expect((await checkOutBooking(BOOKING_ID, transport)).status).toBe("completed");
  });

  it("REQ-HREQ-006 recusa da API chega com o código", async () => {
    server.use(
      http.post(`${path}/acceptance`, () => HttpResponse.json(apiFail("BOOKING_RESPONSE_EXPIRED"), { status: 422 })),
    );
    await expect(acceptBooking(BOOKING_ID, transport)).rejects.toMatchObject({ code: "BOOKING_RESPONSE_EXPIRED" });
  });
});
