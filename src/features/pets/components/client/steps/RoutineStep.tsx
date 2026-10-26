"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { petStepSchemas } from "../../../schemas/petProfileSchema";
import { usePetStep } from "./PetStepHost";
import { StepForm } from "./StepForm";
import { usePetPreview } from "./usePetPreview";
import { useServerErrors } from "./useServerErrors";

const copy = petWizardCopy.routine;
type Values = z.input<typeof petStepSchemas.routine>;
type Accepted = z.output<typeof petStepSchemas.routine>;

/** Acrescenta o atalho no fim do texto, separado por vírgula, sem repetir (REQ-PNEW-011). */
function withChip(text: string, chip: string): string {
  if (text.includes(chip)) return text;
  return text.trim() ? `${text.trim().replace(/[.,;]$/, "")}, ${chip}` : chip;
}

/**
 * Passo 5, "Rotina e manias" (REQ-PNEW-011): alimentação (até 1000) e manias (até 2000); os atalhos inserem
 * o texto no campo, que continua editável.
 *
 * @example <RoutineStep />
 */
export function RoutineStep() {
  const { values, accept: acceptStep } = usePetStep();
  const { control, handleSubmit, setError, formState } = useForm<Values, unknown, Accepted>({
    resolver: zodResolver(petStepSchemas.routine),
    defaultValues: { feedingNotes: values.feedingNotes ?? "", notes: values.notes ?? "" },
  });
  usePetPreview(control);
  useServerErrors(setError, ["feedingNotes", "notes"]);

  return (
    <StepForm dirty={formState.isDirty} title={copy.title} onSubmit={handleSubmit((accepted) => acceptStep(accepted))}>
      <Typography color="text.secondary">{copy.help}</Typography>
      {(["feedingNotes", "notes"] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => {
            const text = typeof field.value === "string" ? field.value : "";
            return (
              <Stack spacing={1}>
                <TextField
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  value={text}
                  inputRef={field.ref}
                  label={name === "feedingNotes" ? copy.feeding : copy.notes}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  multiline
                  minRows={2}
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: name === "feedingNotes" ? 1000 : 2000 } }}
                />
                <ChipPicker
                  label={copy.shortcuts}
                  options={copy.chips}
                  selected={copy.chips.filter((chip) => text.includes(chip))}
                  onPick={(chip) => field.onChange(withChip(text, chip))}
                />
              </Stack>
            );
          }}
        />
      ))}
    </StepForm>
  );
}
