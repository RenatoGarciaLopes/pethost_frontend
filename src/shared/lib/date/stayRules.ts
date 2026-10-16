/** Brasília em UTC−3 fixo, como o `BookingClock` da API (o Brasil não tem horário de verão desde 2019). */
const BRASILIA_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * O dia de hoje em Brasília (`yyyy-MM-dd`), a régua das regras de estadia da API (chegada, janela do check-in). Às 23h
 * do dia 19 em Brasília ainda é dia 19, qualquer que seja o fuso do navegador.
 *
 * @example brasiliaToday(new Date("2026-12-20T02:00:00Z")) // "2026-12-19"
 */
export function brasiliaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + BRASILIA_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Soma (ou subtrai) dias a uma data de calendário `yyyy-MM-dd`.
 * @example addDays("2026-12-31", 1) // "2027-01-01"
 */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
