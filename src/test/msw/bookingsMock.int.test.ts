import { afterEach, describe, expect, it } from "vitest";
import { bookingsHandlers, resetBookings, seedBooking } from "../../../e2e/support/handlers/bookings.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import {
  GetApiV1BookingsBookingIdResponse,
  GetApiV1BookingsMeResponse,
} from "@/shared/api/generated/bookings/bookings.zod";
import { GetApiV1PetsPetIdResponse } from "@/shared/api/generated/pets/pets.zod";
import { server } from "./server";

const API = "http://localhost:5099/api/v1";
const host = switchAccounts.find((item) => item.scenario === "both" && item.user.role === "host")!;

afterEach(resetBookings);

function caller() {
  server.use(...bookingsHandlers);
  const { accessToken } = issueSession(host.user);
  return async (path: string, method = "GET", body?: object) => {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Bearer ${accessToken}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
}

describe("mock de reservas do anfitrião", () => {
  it("REQ-HREQ-001 REQ-HREQ-004 lista por status, no formato do contrato, e aceitar confirma com o telefone", async () => {
    const booking = seedBooking(host.user.id);
    const call = caller();
    const requested = await call("/bookings/me?status=requested");
    expect(GetApiV1BookingsMeResponse.parse(requested.body).data?.totalCount).toBe(1);
    expect((await call("/bookings/me?status=confirmed")).body.data.totalCount).toBe(0);

    const accepted = await call(`/bookings/${booking.id}/acceptance`, "POST");
    expect(GetApiV1BookingsBookingIdResponse.parse(accepted.body).data).toMatchObject({
      status: "confirmed",
      contact: { phone: "44999990000" },
    });
    expect((await call(`/bookings/${booking.id}/acceptance`, "POST")).body.error.code).toBe(
      "BOOKING_NOT_AWAITING_RESPONSE",
    );
  });

  it("REQ-HREQ-003 o anfitrião lê a ficha dos pets do pedido", async () => {
    const booking = seedBooking(host.user.id);
    const sheet = await caller()(`/pets/${booking.pets[0].id}`);
    expect(GetApiV1PetsPetIdResponse.parse(sheet.body).data?.name).toBe("Pipoca");
  });

  it("REQ-STDAY-002 REQ-STDAY-006 chegada só no período; volta só em andamento", async () => {
    const early = seedBooking(host.user.id, { status: "confirmed", checkIn: "2099-01-10", checkOut: "2099-01-15" });
    const call = caller();
    expect((await call(`/bookings/${early.id}/check-in`, "POST")).body.error.code).toBe("BOOKING_CHECK_IN_TOO_EARLY");
    const today = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const now = seedBooking(host.user.id, { status: "confirmed", checkIn: today, checkOut: "2099-01-01" });
    expect((await call(`/bookings/${now.id}/check-out`, "POST")).body.error.code).toBe("BOOKING_NOT_IN_PROGRESS");
    expect((await call(`/bookings/${now.id}/check-in`, "POST")).body.data.status).toBe("in_progress");
    expect((await call(`/bookings/${now.id}/check-out`, "POST")).body.data.status).toBe("completed");
  });
});
