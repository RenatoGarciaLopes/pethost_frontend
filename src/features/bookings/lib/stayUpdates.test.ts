import { describe, expect, it } from "vitest";
import { bookingDto } from "@/test/fixtures/bookings";
import { bookingDtoSchema } from "../api/contracts";
import { toBooking } from "../api/mappers";
import { hasStayUpdates, staySnapshot } from "./stayUpdates";

const booking = toBooking(bookingDtoSchema.parse(bookingDto()));
describe("stay updates", () => {
  it("initializes silently; identical/order-only/removal changes do not notify", () => {
    const current = staySnapshot([booking]);
    expect(hasStayUpdates(current, null)).toBe(false);
    expect(hasStayUpdates(current, current)).toBe(false);
    expect(hasStayUpdates({}, current)).toBe(false);
    expect(staySnapshot([{ ...booking, requestedAt: "irrelevant" }])).toEqual(current);
  });
  it("detects new stays and actionable status/deadline changes", () => {
    const seen = staySnapshot([booking]);
    for (const change of [
      { id: "new" },
      { status: "accepted" as const },
      { paymentDeadline: "tomorrow" },
      { responseDeadline: "later" },
      { checkedInAt: "today" },
      { refundPercentage: 50 },
    ]) {
      expect(hasStayUpdates(staySnapshot([{ ...booking, ...change }]), seen)).toBe(true);
    }
    expect(hasStayUpdates(seen, {})).toBe(true);
  });
});
