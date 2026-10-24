"use client";
import { useState } from "react";
import { validateStay } from "@/shared/lib/date/stayRules";
import { calendarCopy } from "../Calendar/calendarCopy";
import { stayLabel } from "../Calendar/calendarDates";
import { CalendarInput } from "../Calendar/CalendarInput";
import { StayCalendar } from "../Calendar/StayCalendar";

/** Controlado por datas ISO; today vem do servidor. @example { checkIn: "", checkOut: "", today, onChange: setRange } */
export interface DateRangeFieldProps {
  checkIn: string;
  checkOut: string;
  today: string;
  /** Primeira chegada escolhível (pedido de estadia); sem ela, hoje. */
  min?: string;
  onChange: (value: { checkIn: string; checkOut: string }) => void;
  errors?: Partial<Record<"checkIn" | "checkOut", string>>;
}

/**
 * Campo único "Chegada e saída" que abre o calendário do PetHost (dois meses no desktop, folha de baixo no celular) e
 * mostra o período ("24 a 30 out · 6 noites"). Não usar para instantes nem nascimento. Valida ao fechar o calendário e
 * recebe erros de envio/API por prop (mostra o da chegada, ou o da saída se for o único).
 * @example <DateRangeField checkIn={from} checkOut={to} today={today} onChange={setRange} />
 */
export function DateRangeField({ checkIn, checkOut, today, min, onChange, errors = {} }: DateRangeFieldProps) {
  const validation = validateStay(checkIn, checkOut, today);
  const [touched, setTouched] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const error =
    errors.checkIn ?? errors.checkOut ?? (touched ? (validation.checkIn ?? validation.checkOut) : undefined);

  return (
    <>
      <CalendarInput
        label={calendarCopy.stayLabel}
        placeholder={calendarCopy.stayPlaceholder}
        value={stayLabel(checkIn, checkOut)}
        onOpen={setAnchor}
        error={Boolean(error)}
        helperText={error}
        fullWidth
      />
      <StayCalendar
        open={Boolean(anchor)}
        anchorEl={anchor}
        checkIn={checkIn}
        checkOut={checkOut}
        today={today}
        min={min}
        onChange={onChange}
        onClose={() => {
          setTouched(true);
          setAnchor(null);
        }}
      />
    </>
  );
}
