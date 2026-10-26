"use client";

import { Box, FormHelperText, Typography } from "@mui/material";
import { useEffect, useId, useRef, type Ref } from "react";
import { focusRing, keyboardFocus } from "../../../theme/focus";
import { quintalColors as c } from "../../../theme/tokens/colors";
import { quintalRadii } from "../../../theme/tokens/radii";
import { hardShadow } from "../../../theme/tokens/shadows";
import { SPRING_ASSENTAR } from "../../../theme/tokens/springs";
import { formCopy } from "../formCopy";
import { WEEKDAY_VALUES, type Weekday } from "./weekdays";

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
  ref?: Ref<HTMLFieldSetElement>;
}

interface DayToggleProps {
  /** Texto visível (abreviado nos dias). */
  text: string;
  /** Nome acessível completo ("Segunda"); contém o texto visível. */
  name: string;
  checked: boolean;
  /** Parte da semana marcada (só "Todos os dias"). */
  mixed?: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

/** Uma caixa de marcar nativa com cara de botão Quintal: 56 px, grama e ✓ quando marcada, afunda 3 px. */
function DayToggle({ text, name, checked, mixed = false, disabled, onChange }: DayToggleProps) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) input.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <Box
      component="label"
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        minHeight: 56,
        px: 1,
        border: `2px solid ${c.tinta}`,
        borderRadius: `${quintalRadii.field}px`,
        bgcolor: checked ? c.grama : "#fff",
        color: c.tinta,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        userSelect: "none",
        boxShadow: hardShadow(checked ? 0 : 3),
        transform: checked ? "translate(3px, 3px)" : "none",
        transition: `transform ${SPRING_ASSENTAR.duration}ms ${SPRING_ASSENTAR.easing}`,
        [keyboardFocus("&:has(input:focus-visible)")]: focusRing,
        "@media (prefers-reduced-motion: reduce)": { transition: "none", transform: "none" },
      }}
    >
      <Box
        component="input"
        ref={input}
        type="checkbox"
        aria-label={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        sx={{ position: "absolute", opacity: 0, width: "1px", height: "1px", m: 0 }}
      />
      {(checked || mixed) && (
        <Box component="span" aria-hidden="true">
          {checked ? "✓" : "–"}
        </Box>
      )}
      <Box component="span" aria-hidden="true">
        {text}
      </Box>
    </Box>
  );
}

/**
 * Escolha de dias da semana (spec 044, REQ-LIST-010; visual da 104): "Todos os dias" no topo do próprio controle (marca
 * ou desmarca a semana inteira; fica "parcial" com parte dela) e os 7 dias como botões de marcar de 56 px, de segunda a
 * domingo, abreviados na tela e com o nome inteiro para o leitor de tela. Devolve sempre na ordem da semana, como a
 * API. Controlado e sem regra de negócio (o mínimo de dias é de quem usa).
 *
 * Quando usar: dias em que algo acontece toda semana (cantinho recebe). Quando não usar: datas de calendário (use um
 * campo de data).
 *
 * @example <WeekdayPicker label="Dias que recebe" value={days} onChange={setDays} error={errors.availableWeekdays} />
 */
export function WeekdayPicker({ label, value, onChange, error, disabled = false, ref }: WeekdayPickerProps) {
  const id = useId();
  const errorId = `${id}-erro`;
  const all = WEEKDAY_VALUES.every((day) => value.includes(day));

  function toggle(day: Weekday, checked: boolean) {
    onChange(WEEKDAY_VALUES.filter((item) => (item === day ? checked : value.includes(item))));
  }

  return (
    <Box
      component="fieldset"
      ref={ref}
      tabIndex={-1}
      aria-describedby={error ? errorId : undefined}
      sx={{ border: 0, m: 0, p: 0, minWidth: 0, "&:focus": { outline: "none" } }}
    >
      <Typography component="legend" sx={{ p: 0, fontWeight: 700, mb: 1 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "repeat(4, minmax(0, 1fr))", sm: "repeat(7, minmax(0, 1fr))" },
        }}
      >
        <Box sx={{ gridColumn: "1 / -1" }}>
          <DayToggle
            text={formCopy.allWeekdays}
            name={formCopy.allWeekdays}
            checked={all}
            mixed={!all && value.length > 0}
            disabled={disabled}
            onChange={() => onChange(all ? [] : [...WEEKDAY_VALUES])}
          />
        </Box>
        {WEEKDAY_VALUES.map((day) => (
          <DayToggle
            key={day}
            text={formCopy.weekdaysShort[day]}
            name={formCopy.weekdays[day]}
            checked={value.includes(day)}
            disabled={disabled}
            onChange={(checked) => toggle(day, checked)}
          />
        ))}
      </Box>
      {error && (
        <FormHelperText id={errorId} error sx={{ mx: 0, mt: 1 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  );
}
