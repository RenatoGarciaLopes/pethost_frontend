"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@mui/material";
import { useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import type { z } from "zod";
import { ToggleRow } from "@/shared/ui/forms/ToggleRow";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { petStepSchemas } from "../../../schemas/petProfileSchema";
import { usePetWizard } from "../../../stores/PetWizardProvider";
import { StepForm } from "./StepForm";
import { useServerErrors } from "./useServerErrors";
import { YesNoField } from "./YesNoField";

const copy = petWizardCopy.health;
type Values = z.input<typeof petStepSchemas.health>;
type Accepted = z.output<typeof petStepSchemas.health>;
type TextName = "medicationNotes" | "allergies" | "vetContact" | "microchip";

interface NotesFieldProps {
  control: Control<Values, unknown, Accepted>;
  name: TextName;
  label: string;
  help?: string;
  max: number;
}

function NotesField({ control, name, label, help, max }: NotesFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          name={field.name}
          onBlur={field.onBlur}
          onChange={field.onChange}
          value={typeof field.value === "string" ? field.value : ""}
          inputRef={field.ref}
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? help}
          fullWidth
          multiline={max > 160}
          slotProps={{ htmlInput: { maxLength: max } }}
        />
      )}
    />
  );
}

/**
 * Passo 4, "Saúde" (REQ-PNEW-010): vacinas e castração (Sim/Não obrigatórios); remédio e alergia abrem por
 * `ToggleRow`; veterinário e microchip opcionais. Desligar um toggle apaga o texto dele (não vai para a API).
 *
 * @example <HealthStep />
 */
export function HealthStep() {
  const values = usePetWizard((state) => state.values);
  const acceptStep = usePetWizard((state) => state.acceptStep);
  const [medication, setMedication] = useState(Boolean(values.medicationNotes));
  const [allergy, setAllergy] = useState(Boolean(values.allergies));
  const { control, handleSubmit, setValue, setError } = useForm<Values, unknown, Accepted>({
    resolver: zodResolver(petStepSchemas.health),
    defaultValues: {
      isVaccinated: values.isVaccinated,
      isNeutered: values.isNeutered,
      medicationNotes: values.medicationNotes ?? "",
      allergies: values.allergies ?? "",
      vetContact: values.vetContact ?? "",
      microchip: values.microchip ?? "",
    },
  });
  useServerErrors(setError, ["isVaccinated", "isNeutered", "medicationNotes", "allergies", "vetContact", "microchip"]);

  return (
    <StepForm title={copy.title} onSubmit={handleSubmit((accepted) => acceptStep(accepted))}>
      <YesNoField control={control} name="isVaccinated" label={copy.vaccinated} />
      <YesNoField control={control} name="isNeutered" label={copy.neutered} />
      <ToggleRow
        label={copy.medication}
        checked={medication}
        onChange={(checked) => {
          setMedication(checked);
          if (!checked) setValue("medicationNotes", "");
        }}
      >
        <NotesField control={control} name="medicationNotes" label={copy.medicationNotes} max={1000} />
      </ToggleRow>
      <ToggleRow
        label={copy.allergy}
        checked={allergy}
        onChange={(checked) => {
          setAllergy(checked);
          if (!checked) setValue("allergies", "");
        }}
      >
        <NotesField control={control} name="allergies" label={copy.allergies} max={1000} />
      </ToggleRow>
      <NotesField control={control} name="vetContact" label={copy.vet} max={160} />
      <NotesField control={control} name="microchip" label={copy.microchip} help={copy.microchipHelp} max={20} />
    </StepForm>
  );
}
