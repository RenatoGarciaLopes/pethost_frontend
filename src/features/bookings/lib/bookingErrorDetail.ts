import { isApiError } from "@/shared/api/errors/ApiError";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A data citada num erro de reserva (`BOOKING_CAPACITY_EXCEEDED`: a noite cheia; `BOOKING_WEEKDAY_NOT_AVAILABLE`: o dia
 * fechado), vinda de `params.date` do erro de topo (`yyyy-MM-dd`). Nunca lê a mensagem em inglês.
 *
 * @example const detail = bookingErrorDetail(error); detail && `Não tem vaga na noite de ${detail.dateLabel}.`
 */
export function bookingErrorDetail(error: unknown): { date: string; dateLabel: string } | null {
  if (!isApiError(error)) return null;
  const { date } = error.params;
  const match = typeof date === "string" ? ISO_DATE.exec(date) : null;
  if (!match) return null;
  const [, , month, day] = match;
  return { date: match[0], dateLabel: `${day}/${month}` };
}
