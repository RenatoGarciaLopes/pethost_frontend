"use client";

import { FormHelperText, Stack } from "@mui/material";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { petWizardCopy } from "../../../lib/petWizardCopy";

const OPTIONS = [
  { value: "yes", label: petWizardCopy.health.yes },
  { value: "no", label: petWizardCopy.health.no },
] as const;

export interface YesNoFieldProps<T extends FieldValues, TOutput> {
  control: Control<T, unknown, TOutput>;
  name: Path<T>;
  label: string;
}

/**
 * Sim/Não obrigatório ligado a um campo booleano (vacinas, castração e convivência, REQ-PNEW-010 e 012).
 * Sem resposta, nada vem marcado: o pet não ganha um "não" que ninguém disse.
 *
 * @example <YesNoField control={control} name="isVaccinated" label="Está com as vacinas em dia?" />
 */
export function YesNoField<T extends FieldValues, TOutput>({ control, name, label }: YesNoFieldProps<T, TOutput>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Stack
          spacing={0.5}
          ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("button[role=radio]") ?? null)}
        >
          <SegmentedControl
            label={label}
            options={OPTIONS}
            value={field.value === true ? "yes" : field.value === false ? "no" : ""}
            onChange={(value) => field.onChange(value === "yes")}
          />
          {fieldState.error && (
            <FormHelperText role="alert" error>
              {fieldState.error.message}
            </FormHelperText>
          )}
        </Stack>
      )}
    />
  );
}
