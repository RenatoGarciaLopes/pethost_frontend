import { addDays, brasiliaToday } from "@/shared/lib/date/stayRules";

/** Datas de calendário (`yyyy-MM-dd`) formatadas como UTC, para o dia não andar com o fuso. */
const dayMonth = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const BRASILIA = "America/Sao_Paulo";
const hourMinute = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: BRASILIA,
});
const weekdayDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: BRASILIA,
});
const NEAR_MS = 3 * 60 * 60 * 1000;

const asDate = (date: string) => new Date(`${date}T00:00:00Z`);

/**
 * Período da estadia, curto: "20 a 25 de dez.", "30 de nov. a 2 de dez." ou, atravessando o ano, com os anos.
 * @example formatPeriod(booking.checkIn, booking.checkOut)
 */
export function formatPeriod(checkIn: string, checkOut: string): string {
  const [start, end] = [asDate(checkIn), asDate(checkOut)];
  if (start.getUTCFullYear() !== end.getUTCFullYear())
    return `${dayMonthYear.format(start)} a ${dayMonthYear.format(end)}`;
  if (start.getUTCMonth() === end.getUTCMonth()) return `${start.getUTCDate()} a ${dayMonth.format(end)}`;
  return `${dayMonth.format(start)} a ${dayMonth.format(end)}`;
}

/** "18h30" ou "9h" (sem ":00"), em Brasília. */
function timeOf(moment: Date): string {
  const [hour, minute] = hourMinute.format(moment).split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

/**
 * Prazo de resposta em Brasília (REQ-HREQ-002): "hoje às 18h30", "amanhã às 9h" ou "sábado, 12/12, às 23h".
 * @example `Responda até ${formatDeadline(booking.responseDeadline, now)}`
 */
export function formatDeadline(deadline: string, now: Date = new Date()): string {
  const moment = new Date(deadline);
  const day = brasiliaToday(moment);
  const today = brasiliaToday(now);
  if (day === today) return `hoje às ${timeOf(moment)}`;
  if (day === addDays(today, 1)) return `amanhã às ${timeOf(moment)}`;
  const [weekday, date] = weekdayDate.format(moment).split(", ");
  return `${weekday}, ${date}, às ${timeOf(moment)}`;
}

/**
 * Faltam menos de 3 horas para o prazo (e ele não passou)? A lista destaca o pedido (REQ-HREQ-002).
 * @example isDeadlineNear(booking.responseDeadline, now)
 */
export function isDeadlineNear(deadline: string | null, now: Date = new Date()): boolean {
  if (!deadline) return false;
  const left = Date.parse(deadline) - now.getTime();
  return left > 0 && left < NEAR_MS;
}
