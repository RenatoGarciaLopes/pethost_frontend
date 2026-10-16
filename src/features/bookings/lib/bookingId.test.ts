import { expect, it } from "vitest";
import { isBookingId } from "./bookingId";

it("REQ-HREQ-003 só UUID é id de pedido; o resto vai direto para o 404", () => {
  expect(isBookingId("0199f0a0-0000-7000-8000-0000000000d1")).toBe(true);
  expect(isBookingId("pedido-1")).toBe(false);
});
