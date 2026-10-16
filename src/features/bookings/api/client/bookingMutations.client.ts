import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { bookingDtoSchema, type BookingDto } from "../contracts";

const bookingPath = (bookingId: string) => `/bookings/${encodeURIComponent(bookingId)}`;

function post(bookingId: string, action: string, transport: HttpTransport, body?: unknown): Promise<BookingDto> {
  return transport.request({ method: "POST", path: `${bookingPath(bookingId)}/${action}`, body }, bookingDtoSchema);
}

/** Motivo opcional (até 500): vazio não vai. */
const reasonBody = (reason: string) => (reason.trim() ? { reason: reason.trim() } : {});

/**
 * O anfitrião aceita o pedido (REQ-HREQ-004). Hoje aceitar já confirma (sem pagamento).
 * @example await acceptBooking(booking.id);
 */
export function acceptBooking(bookingId: string, transport: HttpTransport = bffClient) {
  return post(bookingId, "acceptance", transport);
}

/**
 * O anfitrião recusa o pedido, com motivo opcional (REQ-HREQ-005).
 * @example await declineBooking(booking.id, "Não estarei em casa");
 */
export function declineBooking(bookingId: string, reason: string, transport: HttpTransport = bffClient) {
  return post(bookingId, "refusal", transport, reasonBody(reason));
}

/**
 * Tutor ou anfitrião cancela até o check-in, com motivo opcional (REQ-HREQ-007, 052).
 * @example await cancelBooking(booking.id, "");
 */
export function cancelBooking(bookingId: string, reason: string, transport: HttpTransport = bffClient) {
  return post(bookingId, "cancellation", transport, reasonBody(reason));
}

/**
 * "Chegou": só confirmada, do dia da chegada até a véspera da saída (REQ-STDAY-002).
 * @example await checkInBooking(booking.id);
 */
export function checkInBooking(bookingId: string, transport: HttpTransport = bffClient) {
  return post(bookingId, "check-in", transport);
}

/**
 * "Voltou pra casa": só em andamento, pode ser antes do dia de saída (REQ-STDAY-004).
 * @example await checkOutBooking(booking.id);
 */
export function checkOutBooking(bookingId: string, transport: HttpTransport = bffClient) {
  return post(bookingId, "check-out", transport);
}
