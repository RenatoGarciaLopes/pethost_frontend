"use client";

import { InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { formatBRL, fromCents, netEarnings } from "@/shared/lib/money";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
import { Counter } from "@/shared/ui/forms/Counter";
import { WeekdayPicker, type Weekday } from "@/shared/ui/forms/WeekdayPicker";
import { listingCopy } from "../../../lib/listingCopy";
import { parseRateCents } from "../../../schemas/listingSchema";
import { ListingSection } from "./ListingSectionHost";

/**
 * "Endereço" (REQ-LIST-008): o CEP preenche o resto, como no cadastro da conta; o tutor só vê o bairro até a estadia
 * ser confirmada. Pessoa física começa com o endereço da conta como sugestão.
 * @example <AddressSection suggested />
 */
export function AddressSection({ suggested = false }: { suggested?: boolean }) {
  const copy = listingCopy.address;
  return (
    <ListingSection id="address">
      {() => (
        <>
          <Typography color="text.secondary">{copy.help}</Typography>
          {suggested && <Typography variant="body2">{copy.suggested}</Typography>}
          <AddressFields name="address" />
        </>
      )}
    </ListingSection>
  );
}

/**
 * "Regras da casa" (REQ-LIST-010): opcional, até 2000 caracteres, com atalhos que acrescentam uma linha.
 * @example <RulesSection />
 */
export function RulesSection() {
  const copy = listingCopy.rules;
  return (
    <ListingSection id="rules">
      {() => (
        <Controller
          name="houseRules"
          render={({ field, fieldState }) => {
            const text: string = field.value;
            const lines = text.split("\n").map((line) => line.trim());
            return (
              <Stack spacing={2}>
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
                  minRows={3}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? copy.help}
                  fullWidth
                />
              </Stack>
            );
          }}
        />
      )}
    </ListingSection>
  );
}

/**
 * "Dias que recebe" (REQ-LIST-010): os 7 dias, ao menos um.
 * @example <WeekdaysSection />
 */
export function WeekdaysSection() {
  return (
    <ListingSection id="weekdays">
      {() => (
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
      )}
    </ListingSection>
  );
}

/** Simulação líquida com pets e noites ajustáveis; atualiza a cada tecla (REQ-LIST-009). */
function Simulation() {
  const copy = listingCopy.rate;
  const rate: string = useWatch({ name: "nightlyRate" });
  const [pets, setPets] = useState(2);
  const [nights, setNights] = useState(10);
  const cents = parseRateCents(rate) ?? 0;
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
        <Counter label={copy.simulationPets} value={pets} min={1} max={10} onChange={setPets} />
        <Counter label={copy.simulationNights} value={nights} min={1} max={31} onChange={setNights} />
      </Stack>
      <Typography role="status" sx={{ fontWeight: 800, fontSize: "1.15rem" }}>
        {copy.simulation(pets, nights, formatBRL(fromCents(netEarnings(cents, pets, nights))))}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {copy.fee}
      </Typography>
    </Stack>
  );
}

/**
 * "Diária por pet" (REQ-LIST-009): de R$ 10,00 a R$ 10.000,00 e a simulação do que o anfitrião recebe (90%).
 * @example <RateSection />
 */
export function RateSection() {
  const copy = listingCopy.rate;
  return (
    <ListingSection id="rate">
      {() => (
        <>
          <Controller
            name="nightlyRate"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                inputRef={field.ref}
                label={copy.label}
                inputMode="decimal"
                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? copy.help}
                sx={{ maxWidth: 280 }}
              />
            )}
          />
          <Simulation />
        </>
      )}
    </ListingSection>
  );
}
