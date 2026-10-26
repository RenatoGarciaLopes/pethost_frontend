import { afterEach, describe, expect, it } from "vitest";
import { bookingsHandlers, resetBookings, seedBooking } from "../../../e2e/support/handlers/bookings.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import {
  GetApiV1BookingsBookingIdResponse,
  GetApiV1BookingsMeResponse,
} from "@/shared/api/generated/bookings/bookings.zod";
import { GetApiV1PetsPetIdResponse } from "@/shared/api/generated/pets/pets.zod";
import { LISTING_ID } from "../../../e2e/support/handlers/listingPage.mjs";
import { resetPets } from "../../../e2e/support/handlers/pets.mjs";
import { server } from "./server";

const API = "http://localhost:5099/api/v1";
const host = switchAccounts.find((item) => item.scenario === "both" && item.user.role === "host")!;
const owner = switchAccounts.find((item) => item.scenario === "both" && item.user.role === "owner")!;

afterEach(resetBookings);

function caller(account = host) {
  server.use(...bookingsHandlers);
  const { accessToken } = issueSession(account.user);
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

describe("mock de reservas do tutor", () => {
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  it("REQ-STAYS-001 REQ-STAYS-009 o tutor vê só as próprias estadias; a de outra pessoa é 404", async () => {
    const mine = seedBooking(null, {}, owner.user.id);
    const other = seedBooking(host.user.id);
    const call = caller(owner);
    const list = GetApiV1BookingsMeResponse.parse((await call("/bookings/me?status=requested")).body);
    expect(list.data?.items.map((item) => item.id)).toEqual([mine.id]);
    expect((await call(`/bookings/${other.id}`)).status).toBe(404);
    expect((await call(`/bookings/${mine.id}/acceptance`, "POST")).status).toBe(404);
  });

  it("REQ-STAYS-006 REQ-STAYS-007 cancelar: reembolso total com 48 horas ou mais, metade com menos", async () => {
    const call = caller(owner);
    const far = seedBooking(null, { status: "confirmed", checkIn: inDays(5), checkOut: inDays(8) }, owner.user.id);
    const near = seedBooking(null, { status: "confirmed", checkIn: inDays(1), checkOut: inDays(3) }, owner.user.id);
    const cancelled = await call(`/bookings/${far.id}/cancellation`, "POST", { reason: "Mudança de planos" });
    expect(GetApiV1BookingsBookingIdResponse.parse(cancelled.body).data).toMatchObject({
      status: "cancelled",
      cancelledBy: "owner",
      cancellationReason: "Mudança de planos",
      refundPercentage: 100,
    });
    expect((await call(`/bookings/${near.id}/cancellation`, "POST")).body.data.refundPercentage).toBe(50);
    expect((await call(`/bookings/${far.id}/cancellation`, "POST")).body.error.code).toBe("BOOKING_ALREADY_CANCELLED");
  });
});

describe("mock do pedido de estadia", () => {
  const LUNA = "0199d2a0-0000-7000-8000-0000000000e1";
  const THOR = "0199d2a0-0000-7000-8000-0000000000e2";
  const MEL = "0199d2a0-0000-7000-8000-0000000000e3";
  /** A próxima segunda-feira com pelo menos 4 dias de folga (72 h de antecedência do pedido), em Brasília. */
  const monday = (() => {
    let day = new Date(Date.now() - 3 * 60 * 60 * 1000 + 4 * 86_400_000);
    while (day.getUTCDay() !== 1) day = new Date(day.getTime() + 86_400_000);
    return day.toISOString().slice(0, 10);
  })();
  const plus = (date: string, days: number) =>
    new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
  const request = (petIds: string[], checkIn = monday, checkOut = plus(monday, 2)) => ({
    listingId: LISTING_ID,
    petIds,
    checkIn,
    checkOut,
    careTermsAccepted: true,
  });

  afterEach(resetPets);

  it("REQ-REQST-005 o tutor pede: o pedido nasce esperando resposta, com a conta e o prazo, e aparece nas estadias", async () => {
    const call = caller(owner);
    const created = await call("/bookings", "POST", request([LUNA, THOR]));
    expect(created.status).toBe(201);
    expect(GetApiV1BookingsBookingIdResponse.parse(created.body).data).toMatchObject({
      status: "requested",
      nights: 2,
      petCount: 2,
      nightlyRate: 60,
      totalPrice: 240,
    });
    expect(created.body.data.responseDeadline).toBeTruthy();
    expect((await call("/bookings/me?status=requested")).body.data.items).toHaveLength(1);
  });

  it("REQ-REQST-010 chegada com menos de 72 h e pedido sem aceite do cuidado voltam 400 por campo", async () => {
    const call = caller(owner);
    const soonDay = new Date(Date.now() - 3 * 60 * 60 * 1000 + 3 * 86_400_000).toISOString().slice(0, 10);
    const soon = await call("/bookings", "POST", request([LUNA], soonDay, plus(soonDay, 2)));
    expect(soon.status).toBe(400);
    expect(soon.body.error.details).toMatchObject([{ field: "checkIn" }]);
    const noTerms = await call("/bookings", "POST", { ...request([LUNA]), careTermsAccepted: false });
    expect(noTerms.body.error.details).toMatchObject([{ field: "careTermsAccepted" }]);
  });

  it("REQ-REQST-007 regras na ordem da API: campos, pet fora da lista, outro pedido nas mesmas noites, dia fechado", async () => {
    const call = caller(owner);
    const invalid = await call("/bookings", "POST", { listingId: LISTING_ID, petIds: [], checkIn: "", checkOut: "" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.map((item: { field: string }) => item.field)).toEqual([
      "petIds",
      "checkIn",
      "checkOut",
      "careTermsAccepted",
    ]);
    expect((await call("/bookings", "POST", request([MEL]))).body.error.code).toBe("BOOKING_PET_INACTIVE");
    await call("/bookings", "POST", request([LUNA]));
    const conflict = await call("/bookings", "POST", request([LUNA]));
    expect(conflict.body.error).toMatchObject({
      code: "BOOKING_PET_PERIOD_CONFLICT",
      params: { petId: LUNA },
    });
    const sunday = await call("/bookings", "POST", request([THOR], plus(monday, 5), plus(monday, 7)));
    expect(sunday.body.error).toMatchObject({
      code: "BOOKING_WEEKDAY_NOT_AVAILABLE",
      params: { date: plus(monday, 6) },
    });
  });

  it("REQ-REQST-001 só a conta de tutor pede; cantinho desconhecido é 404", async () => {
    expect((await caller()("/bookings", "POST", request([LUNA]))).body.error.code).toBe("BOOKING_OWNER_NOT_FOUND");
    const unknown = { ...request([LUNA]), listingId: "0199d2a0-0000-7000-8000-0000000000ff" };
    expect((await caller(owner)("/bookings", "POST", unknown)).body.error.code).toBe("BOOKING_LISTING_NOT_FOUND");
  });
});
