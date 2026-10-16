import { isApiError } from "@/shared/api/errors/ApiError";

/**
 * A data citada num erro de reserva (`BOOKING_CAPACITY_EXCEEDED`: a noite cheia; `BOOKING_WEEKDAY_NOT_AVAILABLE`: o dia
 * fechado). A API não manda `details` com a data, só a cita na mensagem em inglês; daqui só sai a data, nunca o texto.
 *
 * @example const detail = bookingErrorDetail(error); detail && `Não tem vaga na noite de ${detail.dateLabel}.`
 */
export function bookingErrorDetail(error: unknown): { date: string; dateLabel: string } | null {
  if (!isApiError(error)) return null;
  const match = /(\d{4})-(\d{2})-(\d{2})/.exec(error.message);
  if (!match) return null;
  const [date, , month, day] = match;
  return { date, dateLabel: `${day}/${month}` };
}
