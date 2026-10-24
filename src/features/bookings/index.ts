/**
 * API pública neutra de bookings (specs 050 a 054).
 * Exporte aqui tipos, schemas e funções puras compartilháveis entre ambientes.
 * Não exporte hooks, componentes client ou recursos exclusivos do servidor.
 */
export { bookingCopy } from "./lib/bookingCopy";
export { isBookingId } from "./lib/bookingId";
export { statusLabel } from "./lib/bookingStatus";
export { formatPeriod } from "./lib/formatStay";
export type { Booking, BookingStatus } from "./types";
