import type { SeenSnapshot } from "@/shared/lib/seenSnapshots";
import type { Booking } from "../types";

/** Only actionable fields exposed by Booking. Reading/ordering timestamps never trigger updates.
 * Installments are not exposed by the current list contract and cannot be compared yet.
 * @example staySnapshot(bookings)
 */
export function staySnapshot(bookings: readonly Booking[]): SeenSnapshot {
  return Object.fromEntries(
    bookings.map((booking) => [
      booking.id,
      JSON.stringify([
        booking.status,
        booking.responseDeadline,
        booking.paymentDeadline,
        booking.checkedInAt,
        booking.checkedOutAt,
        booking.cancelledBy,
        booking.refundPercentage,
      ]),
    ]),
  );
}

/** New/changed stays notify; removal alone does not. First visit is initialized without notifying. */
export function hasStayUpdates(current: SeenSnapshot, seen: SeenSnapshot | null): boolean {
  return seen !== null && Object.entries(current).some(([id, signature]) => seen[id] !== signature);
}
