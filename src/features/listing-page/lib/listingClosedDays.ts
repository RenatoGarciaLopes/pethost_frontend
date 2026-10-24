import type { CalendarClosedDay } from "@/shared/ui/forms/Calendar";
import { listingPageCopy } from "./listingPageCopy";

const copy = listingPageCopy.closedDays;
/** Índice do `getUTCDay` (0 = domingo) para o dia do contrato. */
const BY_INDEX = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
/** Ordem da frase: a semana de trabalho primeiro, como na lista de regras da casa. */
const IN_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** Período fechado na agenda do cantinho, de `startDate` a `endDate` (inclusive, `yyyy-MM-dd`). */
export interface ListingClosedPeriod {
  startDate: string;
  endDate: string;
}

function joinPt(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}

/**
 * Os dias em que não dá pra estar no cantinho, com o motivo para o calendário: os dias da semana fora de
 * `availableWeekdays` e os períodos que o anfitrião fechou (`GET /listings/{id}/availability-blocks`, só com conta).
 * Mesma regra da API (`BOOKING_WEEKDAY_NOT_AVAILABLE`, `BOOKING_DATES_BLOCKED`): todo dia da chegada à saída,
 * inclusive, precisa estar aberto.
 * @example listingClosedDays(["monday", "saturday"], blocks)("2026-11-08") // { reason: "o cantinho não recebe…", legend: "Não recebe…" }
 */
export function listingClosedDays(
  availableWeekdays: readonly string[],
  blocks: readonly ListingClosedPeriod[] = [],
): (iso: string) => CalendarClosedDay | null {
  const closedWeekdays = IN_ORDER.filter((day) => !availableWeekdays.includes(day));
  const days = joinPt(closedWeekdays.map((day) => copy.weekdayPlural[day]));
  const weekday: CalendarClosedDay = { reason: copy.weekdays(days), legend: copy.weekdaysLegend(days) };
  const blocked: CalendarClosedDay = { reason: copy.blocked, legend: copy.blockedLegend };
  return (iso) => {
    const day = BY_INDEX[new Date(`${iso}T00:00:00Z`).getUTCDay()]!;
    if (closedWeekdays.some((closed) => closed === day)) return weekday;
    if (blocks.some((block) => iso >= block.startDate && iso <= block.endDate)) return blocked;
    return null;
  };
}
