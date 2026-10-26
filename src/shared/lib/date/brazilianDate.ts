/** Data de calendário sem hora nem fuso (nascimento, por exemplo). Mês de 1 a 12. */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Lê uma data brasileira digitada: `dd/mm/aaaa` ou 8 dígitos `ddmmaaaa`.
 * Devolve `null` se estiver incompleta ou não existir (31/04, 29/02 fora de ano bissexto, ano antes de 1900).
 *
 * @example parseBrazilianDate("29/02/2024") // { year: 2024, month: 2, day: 29 }
 */
export function parseBrazilianDate(value: string): CalendarDate | null {
  const match = /^(\d{2})\/?(\d{2})\/?(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** Formato da API (`yyyy-MM-dd`). @example toIsoDate({ year: 1990, month: 5, day: 3 }) // "1990-05-03" */
export function toIsoDate({ year, month, day }: CalendarDate): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Compara duas datas de calendário: negativo se `a` vem antes, 0 se iguais, positivo se depois.
 *
 * @example compareCalendarDates(birth, todayCalendarDate()) > 0 // nascimento no futuro
 */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/**
 * Tem `minAge` anos completos em `today`? Faz aniversário hoje: conta.
 * Quem nasceu em 29/02 completa a idade em 01/03 nos anos não bissextos (a regra do Código Civil
 * conta o dia seguinte quando o dia não existe no mês).
 *
 * @example isAdult(parseBrazilianDate("12/10/2008")!, { year: 2026, month: 10, day: 12 }) // true
 */
export function isAdult(birth: CalendarDate, today: CalendarDate, minAge = 18): boolean {
  const year = birth.year + minAge;
  const leapDayMissing = birth.month === 2 && birth.day === 29 && daysInMonth(year, 2) === 28;
  const birthday = leapDayMissing ? { year, month: 3, day: 1 } : { year, month: birth.month, day: birth.day };
  return compareCalendarDates(birthday, today) <= 0;
}

/** Data de hoje no fuso do navegador. @example todayCalendarDate() // { year: 2026, month: 10, day: 12 } */
export function todayCalendarDate(now = new Date()): CalendarDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
