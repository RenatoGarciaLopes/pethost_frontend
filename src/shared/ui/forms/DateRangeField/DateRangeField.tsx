"use client";
import { Stack, TextField } from "@mui/material";
import { useState } from "react";
import { addDays, validateStay } from "@/shared/lib/date/stayRules";

/** Controlado por datas ISO; today vem do servidor. @example { checkIn: "", checkOut: "", today, onChange: setRange } */
export interface DateRangeFieldProps {
  checkIn: string;
  checkOut: string;
  today: string;
  onChange: (value: { checkIn: string; checkOut: string }) => void;
  errors?: Partial<Record<"checkIn" | "checkOut", string>>;
}
/**
 * Campos de calendário de estadia. Não usar para instantes nem nascimento.
 * Valida ao sair do campo e recebe erros de envio/API por prop.
 * @example <DateRangeField checkIn={from} checkOut={to} today={today} onChange={setRange} />
 */
export function DateRangeField({ checkIn, checkOut, today, onChange, errors = {} }: DateRangeFieldProps) {
  const validation = validateStay(checkIn, checkOut, today);
  const [touched, setTouched] = useState({ checkIn: false, checkOut: false });
  const inError = errors.checkIn ?? (touched.checkIn ? validation.checkIn : undefined);
  const outError = errors.checkOut ?? (touched.checkOut ? validation.checkOut : undefined);
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ "& > *": { flex: 1, minWidth: 0 } }}>
      <TextField
        label="Chegada"
        type="date"
        value={checkIn}
        onChange={(event) => onChange({ checkIn: event.target.value, checkOut })}
        onBlur={() => setTouched((value) => ({ ...value, checkIn: true }))}
        error={Boolean(inError)}
        helperText={inError}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today, max: addDays(today, 365) } }}
      />
      <TextField
        label="Saída"
        type="date"
        value={checkOut}
        onChange={(event) => onChange({ checkIn, checkOut: event.target.value })}
        onBlur={() => setTouched((value) => ({ ...value, checkOut: true }))}
        error={Boolean(outError)}
        helperText={outError}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: {
            min: checkIn ? addDays(checkIn, 1) : addDays(today, 1),
            max: checkIn ? addDays(checkIn, 30) : undefined,
          },
        }}
      />
    </Stack>
  );
}
