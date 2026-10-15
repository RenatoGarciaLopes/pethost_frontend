"use client";

import { Box, Button, Checkbox, FormControlLabel, FormHelperText, Typography } from "@mui/material";
import { useId, type Ref } from "react";
import { formCopy } from "../formCopy";

/** Os dias como a API escreve, de segunda a domingo. */
export const WEEKDAY_VALUES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAY_VALUES)[number];

export interface WeekdayPickerProps {
  /** Nome visível do grupo ("Dias que recebe"). */
  label: string;
  /** Dias marcados (em qualquer ordem). */
  value: readonly Weekday[];
  /** Recebe os dias marcados na ordem da semana. */
  onChange: (value: Weekday[]) => void;
  /** Erro já em português; descreve o grupo. */
  error?: string;
  disabled?: boolean;
  /** Recebe o foco quando há erro (o grupo aceita foco programático). */
  ref?: Ref<HTMLDivElement>;
}

/**
 * Escolha de dias da semana (spec 044, REQ-LIST-010): os 7 dias como caixas de marcar, de segunda a domingo, e o
 * atalho "Todos os dias". Devolve sempre na ordem da semana, como a API. Controlado e sem regra de negócio (o mínimo
 * de dias é de quem usa).
 *
 * Quando usar: dias em que algo acontece toda semana (cantinho recebe, filtro de busca 041). Quando não usar: datas
 * de calendário (use um campo de data).
 *
 * @example <WeekdayPicker label="Dias que recebe" value={days} onChange={setDays} error={errors.availableWeekdays} />
 */
export function WeekdayPicker({ label, value, onChange, error, disabled = false, ref }: WeekdayPickerProps) {
  const id = useId();
  const errorId = `${id}-erro`;

  function toggle(day: Weekday, checked: boolean) {
    onChange(WEEKDAY_VALUES.filter((item) => (item === day ? checked : value.includes(item))));
  }

  return (
    <Box
      ref={ref}
      role="group"
      tabIndex={-1}
      aria-labelledby={id}
      aria-describedby={error ? errorId : undefined}
      sx={{ "&:focus": { outline: "none" } }}
    >
      <Typography id={id} sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2 }}>
        {WEEKDAY_VALUES.map((day) => (
          <FormControlLabel
            key={day}
            label={formCopy.weekdays[day]}
            control={
              <Checkbox
                checked={value.includes(day)}
                disabled={disabled}
                onChange={(event) => toggle(day, event.target.checked)}
              />
            }
          />
        ))}
      </Box>
      <Button variant="quiet" size="small" disabled={disabled} onClick={() => onChange([...WEEKDAY_VALUES])}>
        {formCopy.allWeekdays}
      </Button>
      {error && (
        <FormHelperText id={errorId} error sx={{ mx: 0 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}
