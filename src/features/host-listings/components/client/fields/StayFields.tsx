"use client";

import { Box, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { formatBRL, fromCents, netEarnings } from "@/shared/lib/money";
import { quintalColors as c } from "@/shared/theme/tokens/colors";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
import { Counter } from "@/shared/ui/forms/Counter";
import { WeekdayPicker, type Weekday } from "@/shared/ui/forms/WeekdayPicker";
import { Surface } from "@/shared/ui/layout/Surface";
import { listingCopy } from "../../../lib/listingCopy";
import { parseRateCents } from "../../../schemas/listingSchema";

/**
 * "Regras da casa" (REQ-LIST-010): opcional, até 2000 caracteres, com chips de atalho que acrescentam uma linha.
 * Precisa de `FormProvider`.
 * @example <RulesField />
 */
export function RulesField() {
  const copy = listingCopy.rules;
  return (
    <Controller
      name="houseRules"
      render={({ field, fieldState }) => {
        const text: string = field.value;
        const lines = text.split("\n").map((line) => line.trim());
        return (
          <Stack spacing={2.5}>
            <ChipPicker
              label={copy.shortcuts}
              options={copy.shortcutOptions}
              selected={copy.shortcutOptions.filter((option) => lines.includes(option))}
              onPick={(option) => {
                if (!lines.includes(option)) field.onChange(text.trim() ? `${text.trim()}\n${option}` : option);
              }}
            />
            <TextField
              {...field}
              inputRef={field.ref}
              label={copy.label}
              multiline
              minRows={4}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? copy.help}
              fullWidth
            />
          </Stack>
        );
      }}
    />
  );
}

/**
 * "Dias que recebe" (REQ-LIST-010): os 7 dias, ao menos um, com "Todos os dias" no próprio controle.
 * @example <WeekdaysField />
 */
export function WeekdaysField() {
  return (
    <Controller
      name="availableWeekdays"
      render={({ field, fieldState }) => (
        <WeekdayPicker
          ref={field.ref}
          label={listingCopy.sections.weekdays}
          value={field.value as Weekday[]}
          onChange={field.onChange}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

/**
 * "Diária por pet" (REQ-LIST-009): o valor em número grande, de R$ 10,00 a R$ 10.000,00, teclado decimal.
 * @example <RateField />
 */
export function RateField() {
  const copy = listingCopy.rate;
  return (
    <Controller
      name="nightlyRate"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          inputRef={field.ref}
          label={copy.label}
          inputMode="decimal"
          placeholder="0,00"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ "& p": { fontSize: 24, fontWeight: 800, color: c.tinta } }}>
                  R$
                </InputAdornment>
              ),
              endAdornment: <InputAdornment position="end">{copy.perNight}</InputAdornment>,
            },
          }}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? copy.help}
          sx={{
            maxWidth: 400,
            "& .MuiOutlinedInput-root": { minHeight: 80 },
            "& input": { fontFamily: "var(--font-display)", fontSize: 40, lineHeight: 1.1, py: 1.5 },
          }}
          fullWidth
        />
      )}
    />
  );
}

/**
 * A conta do que fica com o anfitrião (REQ-LIST-009), em destaque: o líquido (90%) em número grande, com pets e
 * noites ajustáveis; acompanha a diária a cada tecla. A frase inteira é um `status`.
 * @example <RateSimulation />
 */
export function RateSimulation() {
  const copy = listingCopy.rate;
  const rate: string = useWatch({ name: "nightlyRate" });
  const [pets, setPets] = useState(2);
  const [nights, setNights] = useState(10);
  const cents = parseRateCents(rate) ?? 0;
  return (
    <Surface component="section" aria-label={copy.simulationTitle} sx={{ bgcolor: c.luz, p: { xs: 2.5, md: 3 } }}>
      <Stack spacing={2.5}>
        <Box role="status">
          <Typography component="span" sx={{ display: "block", fontWeight: 700 }}>
            {copy.simulationLead(pets, nights)}
          </Typography>{" "}
          <Typography
            component="strong"
            sx={{ display: "block", fontFamily: "var(--font-display)", fontSize: { xs: 40, md: 48 }, lineHeight: 1.1 }}
          >
            {formatBRL(fromCents(netEarnings(cents, pets, nights)))}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }}>
          <Counter label={copy.simulationPets} value={pets} min={1} max={10} onChange={setPets} />
          <Counter label={copy.simulationNights} value={nights} min={1} max={31} onChange={setNights} />
        </Stack>
        <Typography variant="body2">{copy.fee}</Typography>
      </Stack>
    </Surface>
  );
}
