"use client";
import { addDays } from "@/shared/lib/date/stayRules";
import { Calendar } from "./Calendar";
import { calendarCopy } from "./calendarCopy";
import { CalendarPopover } from "./CalendarPopover";

export interface StayCalendarProps {
  open: boolean;
  /** Campo ou célula que abriu o calendário. */
  anchorEl: HTMLElement | null;
  /** O que o calendário não pode cobrir (a barra de busca); sem ele, o `anchorEl`. */
  clearEl?: HTMLElement | null;
  checkIn: string;
  checkOut: string;
  today: string;
  onChange: (value: { checkIn: string; checkOut: string }) => void;
  /** `complete` é verdadeiro quando o toque escolheu a saída e fechou o intervalo. */
  onClose: (complete: boolean) => void;
}

/**
 * O calendário de estadia (chegada de hoje a 365 dias, até 30 noites) no popover ou folha de baixo, para qualquer
 * campo ou célula que abra as datas: `DateRangeField` e a barra de busca. Quem usa guarda o estado de aberto.
 *
 * @example <StayCalendar open={open} anchorEl={anchor} checkIn={from} checkOut={to} today={today} onChange={setRange} onClose={close} />
 */
export function StayCalendar({
  open,
  anchorEl,
  clearEl,
  checkIn,
  checkOut,
  today,
  onChange,
  onClose,
}: StayCalendarProps) {
  return (
    <CalendarPopover
      open={open}
      anchorEl={anchorEl}
      clearEl={clearEl}
      onClose={() => onClose(false)}
      label={calendarCopy.rangeDialog}
    >
      {({ compact }) => (
        <Calendar
          mode="range"
          autoFocus
          months={compact ? 1 : 2}
          value={{ start: checkIn, end: checkOut }}
          min={today}
          max={addDays(today, 365)}
          today={today}
          maxNights={30}
          onChange={(range, complete) => {
            onChange({ checkIn: range.start, checkOut: range.end });
            if (complete && !compact) onClose(true);
          }}
          onClear={() => onChange({ checkIn: "", checkOut: "" })}
        />
      )}
    </CalendarPopover>
  );
}
