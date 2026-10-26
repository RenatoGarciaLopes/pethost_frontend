/** Folga entre o calendário e o que ele não pode cobrir (a barra ou o campo). */
export const CALENDAR_GAP = 12;
/** Altura que o popover de dois meses precisa; decide se cabe embaixo. */
const CALENDAR_HEIGHT = 460;

export interface CalendarPlacement {
  /** Ponto da tela onde o popover ancora (coordenadas de viewport). */
  anchorPosition: { top: number; left: number };
  /** Canto do popover que encosta nesse ponto. */
  edge: "top" | "bottom";
}

/**
 * Onde abrir o calendário: embaixo de `clear` (a barra ou o campo que não pode ser coberto), alinhado a `alignLeft`
 * (a célula tocada). Só vai para cima se embaixo não couber e em cima houver mais espaço; nos dois casos o popover
 * fica fora de `clear`.
 *
 * @example placeCalendar({ top: 570, bottom: 690 }, 430, 900) // { anchorPosition: { top: 558, left: 430 }, edge: "bottom" }
 */
export function placeCalendar(
  clear: { top: number; bottom: number },
  alignLeft: number,
  viewportHeight: number,
): CalendarPlacement {
  const below = viewportHeight - clear.bottom - CALENDAR_GAP;
  const above = clear.top - CALENDAR_GAP;
  if (below >= CALENDAR_HEIGHT || above < below) {
    return { anchorPosition: { top: clear.bottom + CALENDAR_GAP, left: alignLeft }, edge: "top" };
  }
  return { anchorPosition: { top: clear.top - CALENDAR_GAP, left: alignLeft }, edge: "bottom" };
}
