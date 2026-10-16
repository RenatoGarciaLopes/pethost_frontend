import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1BookingsBookingIdResponse,
  GetApiV1BookingsMeResponse,
} from "@/shared/api/generated/bookings/bookings.zod";

/** Situações da reserva (`modulo-bookings.md`), na ordem do caminho e depois as que fecham. */
export const BOOKING_STATUSES = [
  "requested",
  "accepted",
  "confirmed",
  "in_progress",
  "completed",
  "declined",
  "expired",
  "cancelled",
] as const;

/** A API aceita maiúsculas; a leitura normaliza antes de estreitar. */
const bookingStatusSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.toLowerCase() : value),
  z.enum(BOOKING_STATUSES),
);

/**
 * A reserva como o tutor e o anfitrião veem, com o status estreitado. Status desconhecido = `CONTRACT_MISMATCH`.
 * @example bookingDtoSchema.parse(data)
 */
export const bookingDtoSchema = unwrapData(GetApiV1BookingsBookingIdResponse).extend({ status: bookingStatusSchema });

/**
 * Uma página de `GET /bookings/me` (do tutor, as que pediu; do anfitrião, as dos cantinhos dele).
 * @example bookingPageSchema.parse(data)
 */
export const bookingPageSchema = unwrapData(GetApiV1BookingsMeResponse).extend({ items: z.array(bookingDtoSchema) });

export type BookingDto = z.output<typeof bookingDtoSchema>;
export type BookingPageDto = z.output<typeof bookingPageSchema>;
