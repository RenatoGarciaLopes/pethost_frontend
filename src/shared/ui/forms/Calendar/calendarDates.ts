import { nightsBetween } from "@/shared/lib/date/stayRules";

/** Mês de calendário (1 a 12), sem dia nem fuso. */
export interface CalendarMonth {
  year: number;
  month: number;
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...options });
const dayFormat = format({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const titleFormat = format({ month: "long", year: "numeric" });
const shortMonth = format({ month: "short" });

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const pad = (value: number, size = 2) => String(value).padStart(size, "0");
const toIso = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Vale para `yyyy-MM-dd` que existe no calendário. @example isIsoDate("2026-02-30") // false */
export function isIsoDate(value: string): boolean {
  return ISO.test(value) && utc(value).toISOString().slice(0, 10) === value;
}

/** Mês de uma data ISO. @example monthOf("2026-12-25") // { year: 2026, month: 12 } */
export function monthOf(iso: string): CalendarMonth {
  const [, year, month] = ISO.exec(iso) ?? [];
  return { year: Number(year), month: Number(month) };
}

/** Soma meses ao mês. @example addMonths({ year: 2026, month: 12 }, 1) // { year: 2027, month: 1 } */
export function addMonths({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Diferença em meses de `a` até `b`. */
export function monthsBetween(a: CalendarMonth, b: CalendarMonth): number {
  return (b.year - a.year) * 12 + (b.month - a.month);
}

/** Soma meses a uma data ISO preservando o dia; no mês curto cai no último dia. @example shiftMonths("2026-01-31", 1) // "2026-02-28" */
export function shiftMonths(iso: string, delta: number): string {
  const { year, month } = addMonths(monthOf(iso), delta);
  return toIso(year, month, Math.min(Number(iso.slice(8)), lastDay(year, month)));
}

/** Semanas do mês começando no domingo; dias de fora são `null`. */
export function buildMonth({ year, month }: CalendarMonth): (string | null)[][] {
  const lead = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: lastDay(year, month) }, (_, index) => toIso(year, month, index + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** @example monthTitle({ year: 2026, month: 10 }) // "outubro de 2026" */
export function monthTitle({ year, month }: CalendarMonth): string {
  return titleFormat.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Data por extenso para leitor de tela. @example dayLabel("2026-12-25") // "sexta-feira, 25 de dezembro de 2026" */
export function dayLabel(iso: string): string {
  return dayFormat.format(utc(iso));
}

/** Data como o campo mostra. @example formatDisplayDate("2026-12-25") // "25/12/2026" */
export function formatDisplayDate(iso: string): string {
  return isIsoDate(iso) ? `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";
}

/** @example shortDate("2026-12-25") // "25 dez" */
export function shortDate(iso: string): string {
  return `${Number(iso.slice(8))} ${shortMonth.format(utc(iso)).replace(".", "")}`;
}

function span(start: string, end: string): string {
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${Number(start.slice(8))} a ${shortDate(end)}`
    : `${shortDate(start)} a ${shortDate(end)}`;
}
const nightsLabel = (start: string, end: string) => {
  const nights = nightsBetween(start, end);
  return `${nights} ${nights === 1 ? "noite" : "noites"}`;
};

/** @example rangeSummary("2026-12-20", "2026-12-25") // "5 noites · 20 a 25 dez" */
export function rangeSummary(start: string, end: string): string {
  return `${nightsLabel(start, end)} · ${span(start, end)}`;
}

/**
 * O período como o campo de datas mostra: vazio, só a chegada ou o intervalo com as noites.
 * @example stayLabel("2026-12-20", "") // "20 dez"
 * @example stayLabel("2026-12-20", "2026-12-25") // "20 a 25 dez · 5 noites"
 */
export function stayLabel(start: string, end: string): string {
  if (!isIsoDate(start)) return "";
  if (!isIsoDate(end) || end <= start) return shortDate(start);
  return `${span(start, end)} · ${nightsLabel(start, end)}`;
}

/** Dia da semana, 0 = domingo. @example weekdayOf("2026-12-25") // 5 */
export function weekdayOf(iso: string): number {
  return utc(iso).getUTCDay();
}

export interface RangeValue {
  start: string;
  end: string;
}

/**
 * O que um toque em `iso` faz no intervalo. Com a chegada escolhida e sem saída, um dia depois
 * da chegada vira saída e fecha o intervalo; qualquer outro dia recomeça pela chegada.
 *
 * @example pickInRange({ start: "2026-12-20", end: "" }, "2026-12-25") // { range: { start: "2026-12-20", end: "2026-12-25" }, complete: true }
 */
export function pickInRange(range: RangeValue, iso: string): { range: RangeValue; complete: boolean } {
  if (range.start && !range.end && iso > range.start) {
    return { range: { start: range.start, end: iso }, complete: true };
  }
  return { range: { start: iso, end: "" }, complete: false };
}
