/** Onde o dia de hoje está em relação à chegada: antes, na janela do check-in ou depois dela. */
export type CheckInWindow = "early" | "open" | "closed";

/**
 * Situação da janela do "chegou" (REQ-STDAY-001): do dia da chegada até a véspera da saída, como a API. Datas
 * `yyyy-MM-dd`; `today` é o dia de hoje em Brasília (`brasiliaToday`).
 *
 * @example checkInWindow(booking.checkIn, booking.checkOut, brasiliaToday()) // "open"
 */
export function checkInWindow(checkIn: string, checkOut: string, today: string): CheckInWindow {
  if (today < checkIn) return "early";
  return today < checkOut ? "open" : "closed";
}

/**
 * Dá pra marcar a chegada hoje? (REQ-STDAY-008)
 * @example isCheckInWindow("2026-12-20", "2026-12-25", "2026-12-20") // true
 */
export function isCheckInWindow(checkIn: string, checkOut: string, today: string): boolean {
  return checkInWindow(checkIn, checkOut, today) === "open";
}
