/** Brasília em UTC−3 fixo, como o `BookingClock` da API (o Brasil não tem horário de verão desde 2019). */
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;
const MAX_ADVANCE_DAYS = 365;
const MAX_NIGHTS = 30;

/**
 * O dia de hoje em Brasília (`yyyy-MM-dd`), a régua das regras de estadia da API (chegada, janela do check-in). Às 23h
 * do dia 19 em Brasília ainda é dia 19, qualquer que seja o fuso do navegador.
 *
 * @example brasiliaToday(new Date("2026-12-20T02:00:00Z")) // "2026-12-19"
 */
export function brasiliaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + BRASILIA_OFFSET_MS).toISOString().slice(0, 10);
}

function dateTime(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN;
}

/** Soma dias de calendário; entrada inválida retorna string vazia. @example addDays("2026-12-31", 1) // "2027-01-01" */
export function addDays(date: string, days: number): string {
  const time = dateTime(date) + days * DAY_MS;
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : "";
}

/** Noites entre datas ISO, sem DST; inválido retorna NaN. @example nightsBetween("2026-10-15", "2026-10-17") // 2 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return (dateTime(checkOut) - dateTime(checkIn)) / DAY_MS;
}

/**
 * Regras da API: chegada de hoje até 365 dias, saída depois, até 30 noites.
 * Sem as duas datas permite busca sem período. Erros são por campo.
 * @example validateStay("2026-10-15", "2026-10-17", "2026-10-15") // {}
 */
export function validateStay(
  checkIn: string,
  checkOut: string,
  today: string,
): Partial<Record<"checkIn" | "checkOut", string>> {
  if (!checkIn && !checkOut) return {};
  const errors: Partial<Record<"checkIn" | "checkOut", string>> = {};
  if (!Number.isFinite(dateTime(checkIn))) errors.checkIn = "Escolhe uma data de chegada válida.";
  else if (checkIn < today || checkIn > addDays(today, MAX_ADVANCE_DAYS))
    errors.checkIn = "A chegada pode ser de hoje até 365 dias à frente.";
  if (!Number.isFinite(dateTime(checkOut))) errors.checkOut = "Escolhe uma data de saída válida.";
  else if (Number.isFinite(dateTime(checkIn))) {
    const nights = nightsBetween(checkIn, checkOut);
    if (nights <= 0) errors.checkOut = "A saída precisa ser depois da chegada.";
    else if (nights > MAX_NIGHTS) errors.checkOut = "Escolhe uma estadia de até 30 noites.";
  }
  return errors;
}
