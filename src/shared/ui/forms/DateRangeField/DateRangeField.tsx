"use client";
import { Stack } from "@mui/material";
import { useState } from "react";
import { addDays, validateStay } from "@/shared/lib/date/stayRules";
import { Calendar } from "../Calendar/Calendar";
import { calendarCopy } from "../Calendar/calendarCopy";
import { CalendarInput } from "../Calendar/CalendarInput";
import { CalendarPopover } from "../Calendar/CalendarPopover";

/** Controlado por datas ISO; today vem do servidor. @example { checkIn: "", checkOut: "", today, onChange: setRange } */
export interface DateRangeFieldProps {
  checkIn: string;
  checkOut: string;
  today: string;
  onChange: (value: { checkIn: string; checkOut: string }) => void;
  errors?: Partial<Record<"checkIn" | "checkOut", string>>;
}

type Edge = "checkIn" | "checkOut";

/**
 * Campos de chegada e saída que abrem o calendário do PetHost (dois meses no desktop, folha de baixo no celular).
 * Não usar para instantes nem nascimento. Valida ao fechar o calendário e recebe erros de envio/API por prop.
 * @example <DateRangeField checkIn={from} checkOut={to} today={today} onChange={setRange} />
 */
export function DateRangeField({ checkIn, checkOut, today, onChange, errors = {} }: DateRangeFieldProps) {
  const validation = validateStay(checkIn, checkOut, today);
  const [touched, setTouched] = useState({ checkIn: false, checkOut: false });
  const [open, setOpen] = useState<{ edge: Edge; anchor: HTMLElement } | null>(null);
  const inError = errors.checkIn ?? (touched.checkIn ? validation.checkIn : undefined);
  const outError = errors.checkOut ?? (touched.checkOut ? validation.checkOut : undefined);

  function close(complete = false) {
    if (open)
      setTouched((value) => ({ ...value, [open.edge]: true, ...(complete && { checkIn: true, checkOut: true }) }));
    setOpen(null);
  }
  function field(edge: Edge, label: string, value: string, error?: string) {
    return (
      <CalendarInput
        label={label}
        value={value}
        onOpen={(anchor) => setOpen({ edge, anchor })}
        error={Boolean(error)}
        helperText={error}
      />
    );
  }
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ "& > *": { flex: 1, minWidth: 0 } }}>
      {field("checkIn", "Chegada", checkIn, inError)}
      {field("checkOut", "Saída", checkOut, outError)}
      <CalendarPopover
        open={Boolean(open)}
        anchorEl={open?.anchor ?? null}
        onClose={() => close()}
        label={calendarCopy.rangeDialog}
      >
        {({ compact }) => (
          <Calendar
            mode="range"
            autoFocus
            months={compact ? 1 : 2}
            value={{ start: checkIn, end: checkOut }}
            editing={open?.edge === "checkOut" ? "end" : "start"}
            min={today}
            max={addDays(today, 365)}
            today={today}
            maxNights={30}
            onChange={(range, complete) => {
              onChange({ checkIn: range.start, checkOut: range.end });
              if (complete && !compact) close(true);
            }}
            onClear={() => onChange({ checkIn: "", checkOut: "" })}
          />
        )}
      </CalendarPopover>
    </Stack>
  );
}
