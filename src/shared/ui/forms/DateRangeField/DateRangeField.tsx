"use client";
import { Stack } from "@mui/material";
import { useState } from "react";
import { validateStay } from "@/shared/lib/date/stayRules";
import { CalendarInput } from "../Calendar/CalendarInput";
import { StayCalendar, type StayEdge } from "../Calendar/StayCalendar";

/** Controlado por datas ISO; today vem do servidor. @example { checkIn: "", checkOut: "", today, onChange: setRange } */
export interface DateRangeFieldProps {
  checkIn: string;
  checkOut: string;
  today: string;
  onChange: (value: { checkIn: string; checkOut: string }) => void;
  errors?: Partial<Record<"checkIn" | "checkOut", string>>;
}

/**
 * Campos de chegada e saída que abrem o calendário do PetHost (dois meses no desktop, folha de baixo no celular).
 * Não usar para instantes nem nascimento. Valida ao fechar o calendário e recebe erros de envio/API por prop.
 * @example <DateRangeField checkIn={from} checkOut={to} today={today} onChange={setRange} />
 */
export function DateRangeField({ checkIn, checkOut, today, onChange, errors = {} }: DateRangeFieldProps) {
  const validation = validateStay(checkIn, checkOut, today);
  const [touched, setTouched] = useState({ checkIn: false, checkOut: false });
  const [open, setOpen] = useState<{ edge: StayEdge; anchor: HTMLElement } | null>(null);
  const inError = errors.checkIn ?? (touched.checkIn ? validation.checkIn : undefined);
  const outError = errors.checkOut ?? (touched.checkOut ? validation.checkOut : undefined);

  function close(complete: boolean) {
    if (open)
      setTouched((value) => ({ ...value, [open.edge]: true, ...(complete && { checkIn: true, checkOut: true }) }));
    setOpen(null);
  }
  function field(edge: StayEdge, label: string, value: string, error?: string) {
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
      <StayCalendar
        edge={open?.edge ?? null}
        anchorEl={open?.anchor ?? null}
        checkIn={checkIn}
        checkOut={checkOut}
        today={today}
        onChange={onChange}
        onClose={close}
      />
    </Stack>
  );
}
