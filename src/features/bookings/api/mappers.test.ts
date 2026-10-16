import { describe, expect, it } from "vitest";
import { bookingDto, bookingPageDto, ownerContactDto } from "@/test/fixtures/bookings";
import { bookingDtoSchema, bookingPageSchema } from "./contracts";
import { toBooking, toBookingPage } from "./mappers";

describe("toBooking", () => {
  it("REQ-HREQ-002 a reserva vira o modelo da tela: valores em centavos, tutor, pets e prazo", () => {
    const booking = toBooking(bookingDtoSchema.parse(bookingDto()));
    expect(booking).toMatchObject({
      status: "requested",
      owner: { name: "Camila Souza", avatarUrl: null },
      pets: [{ name: "Pipoca", species: "dog", size: "small" }],
      checkIn: "2026-12-20",
      checkOut: "2026-12-25",
      nights: 5,
      nightlyRateCents: 6000,
      totalCents: 30000,
      responseDeadline: "2026-12-11T12:00:00+00:00",
      contact: null,
    });
  });

  it("REQ-HREQ-004 o contato só existe depois da confirmação", () => {
    expect(
      toBooking(bookingDtoSchema.parse(bookingDto({ status: "confirmed", contact: ownerContactDto }))).contact,
    ).toEqual({
      phone: "44999990000",
      address: null,
    });
  });

  it("REQ-HREQ-001 status desconhecido não passa pelo contrato; maiúsculas valem", () => {
    expect(() => bookingDtoSchema.parse(bookingDto({ status: "paused" }))).toThrow();
    expect(toBooking(bookingDtoSchema.parse(bookingDto({ status: "IN_PROGRESS" }))).status).toBe("in_progress");
  });

  it("REQ-HREQ-001 página da lista com o total", () => {
    const page = toBookingPage(
      bookingPageSchema.parse(bookingPageDto([bookingDto(), bookingDto({ status: "confirmed" })])),
    );
    expect(page.items.map((item) => item.status)).toEqual(["requested", "confirmed"]);
    expect(page.totalCount).toBe(2);
  });
});
