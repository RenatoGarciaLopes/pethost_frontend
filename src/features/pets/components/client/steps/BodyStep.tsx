"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Autocomplete, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import { DateField } from "@/shared/ui/forms/DateField";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { ageBucketToBirthDate } from "../../../lib/ageBucketToBirthDate";
import { gramsToKg } from "../../../lib/gramsToKg";
import { petsCopy } from "../../../lib/petsCopy";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { requiresSize, usesGrams } from "../../../lib/species";
import { bodyStepSchema } from "../../../schemas/petProfileSchema";
import { usePetStep } from "./PetStepHost";
import type { PetSpecies } from "../../../types";
import { SizeField } from "./SizeField";
import { StepForm } from "./StepForm";
import { useServerErrors } from "./useServerErrors";

const copy = petWizardCopy.body;
type Schema = ReturnType<typeof bodyStepSchema>;
type Values = z.input<Schema>;
type Accepted = z.output<Schema>;

const AGE_MODES = ["puppy", "young", "adult", "senior", "exact"] as const;
type AgeMode = (typeof AGE_MODES)[number];
const AGE_OPTIONS = AGE_MODES.map((value) => ({
  value,
  label: value === "exact" ? copy.ageExact : copy.ageBuckets[value],
}));

/** "4,5" ou "4.5" → 4.5; vazio → undefined; texto inválido → NaN para o schema recusar. */
function parseDecimal(text: string): number | undefined {
  const value = Number(text.trim().replace(",", "."));
  return !text.trim() ? undefined : Number.isFinite(value) ? value : NaN;
}

/**
 * Passo 3, "Sobre o corpo de {nome}" (REQ-PNEW-004, 009): raça livre com vira-lata como primeira sugestão;
 * porte só no cachorro (obrigatório); idade por faixa (vira data aproximada) ou data exata; peso em kg, ou em
 * gramas nos bichos pequenos (convertido para kg).
 *
 * @example <BodyStep />
 */
export function BodyStep() {
  const { values, accept: acceptStep, mode } = usePetStep();
  // Na edição, peso já salvo só troca (REQ-PEDIT-006).
  const keepWeight = mode === "section" && values.weightKg !== undefined;
  const species = values.species as PetSpecies;
  const pet = values.name || petWizardCopy.fallbackName;
  const grams = usesGrams(species);
  const [ageMode, setAgeMode] = useState<AgeMode | "">(values.birthDate ? "exact" : "");
  const [weightText, setWeightText] = useState(() =>
    values.weightKg === undefined ? "" : String(grams ? Math.round(values.weightKg * 1000) : values.weightKg),
  );
  const { control, handleSubmit, setValue, setError, formState } = useForm<Values, unknown, Accepted>({
    resolver: zodResolver(bodyStepSchema(species, { keepWeight })),
    defaultValues: {
      breed: values.breed ?? "",
      size: values.size,
      birthDate: values.birthDate ?? "",
      weightKg: values.weightKg,
    },
  });
  useServerErrors(setError, ["breed", "size", "birthDate", "weightKg"]);

  function chooseAge(mode: AgeMode) {
    setAgeMode(mode);
    if (mode !== "exact") setValue("birthDate", ageBucketToBirthDate(mode, new Date()), { shouldDirty: true });
  }

  return (
    <StepForm
      dirty={formState.isDirty}
      title={copy.title(pet)}
      onSubmit={handleSubmit((accepted) => acceptStep(accepted))}
    >
      <Controller
        control={control}
        name="breed"
        render={({ field, fieldState }) => (
          <Autocomplete
            freeSolo
            options={[copy.mixedBreed]}
            value={field.value ?? ""}
            onInputChange={(_, value) => field.onChange(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={field.ref}
                label={copy.breed}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, maxLength: 60 } }}
              />
            )}
          />
        )}
      />
      {requiresSize(species) && (
        <Controller control={control} name="size" render={(props) => <SizeField {...props} />} />
      )}
      <Stack spacing={1.5} sx={{ "& .MuiToggleButton-root": { minWidth: 0, px: { xs: 1, sm: 2 } } }}>
        <SegmentedControl
          label={copy.age}
          options={AGE_OPTIONS}
          value={ageMode}
          onChange={(value) => chooseAge(value as AgeMode)}
          fullWidth
        />
        {ageMode === "exact" && (
          <Controller
            control={control}
            name="birthDate"
            render={({ field, fieldState }) => (
              <DateField
                name={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ""}
                onChange={field.onChange}
                max={brasiliaToday()}
                label={copy.birthDate}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      </Stack>
      <Controller
        control={control}
        name="weightKg"
        render={({ field, fieldState }) => (
          <TextField
            name={field.name}
            onBlur={field.onBlur}
            inputRef={field.ref}
            value={weightText}
            onChange={(event) => {
              setWeightText(event.target.value);
              const typed = parseDecimal(event.target.value);
              field.onChange(typed === undefined ? undefined : grams ? gramsToKg(typed) : typed);
            }}
            label={grams ? copy.weightGrams : copy.weightKg}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? (keepWeight ? petsCopy.fieldErrors.weightRequired : undefined)}
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
            // Sem porte, o peso é a pista de tamanho: borda mais grossa (REQ-PNEW-009).
            sx={requiresSize(species) ? undefined : { "& .MuiOutlinedInput-notchedOutline": { borderWidth: 2 } }}
          />
        )}
      />
    </StepForm>
  );
}
