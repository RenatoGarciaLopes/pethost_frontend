"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { PET_SPECIES } from "../../../api/contracts";
import { speciesLabel } from "../../../lib/describePet";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { requiresDescription } from "../../../lib/species";
import { petStepSchemas } from "../../../schemas/petProfileSchema";
import { usePetWizard } from "../../../stores/PetWizardProvider";
import { StepForm } from "./StepForm";
import { useServerErrors } from "./useServerErrors";

const copy = petWizardCopy.species;
type Values = z.input<typeof petStepSchemas.species>;
type Accepted = z.output<typeof petStepSchemas.species>;

/** Cachorro e gato primeiro, "Outro bicho" por último: a ordem de `PET_SPECIES` (REQ-PNEW-002). */
const OPTIONS = PET_SPECIES.map((species) => ({ value: species, label: speciesLabel(species, null) }));

/**
 * Passo 1, "Que bicho é o seu?" (REQ-PNEW-002, 003): os 12 bichos; exótico pede "Que bicho é?".
 * @example <SpeciesStep />
 */
export function SpeciesStep() {
  const values = usePetWizard((state) => state.values);
  const acceptStep = usePetWizard((state) => state.acceptStep);
  const { control, handleSubmit, setError } = useForm<Values, unknown, Accepted>({
    resolver: zodResolver(petStepSchemas.species),
    defaultValues: { species: values.species, speciesDescription: values.speciesDescription ?? "" },
  });
  useServerErrors(setError, ["species", "speciesDescription"]);
  const species = useWatch({ control, name: "species" });

  return (
    <StepForm
      title={copy.title}
      onSubmit={handleSubmit(({ species: chosen, speciesDescription }) =>
        acceptStep(requiresDescription(chosen) ? { species: chosen, speciesDescription } : { species: chosen }),
      )}
    >
      <Stack spacing={2}>
        <Controller
          control={control}
          name="species"
          render={({ field, fieldState }) => (
            <Stack
              spacing={1}
              ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("input[type=radio]") ?? null)}
            >
              <ChoiceCardGroup
                label={copy.legend}
                options={OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
              {fieldState.error && (
                <span role="alert" style={{ color: "inherit" }}>
                  {fieldState.error.message}
                </span>
              )}
            </Stack>
          )}
        />
        {species === "exotic" && (
          <Controller
            control={control}
            name="speciesDescription"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                ref={undefined}
                value={field.value ?? ""}
                inputRef={field.ref}
                label={copy.description}
                helperText={fieldState.error?.message ?? copy.descriptionHelp}
                error={Boolean(fieldState.error)}
                required
                fullWidth
                slotProps={{ htmlInput: { maxLength: 60 } }}
              />
            )}
          />
        )}
      </Stack>
    </StepForm>
  );
}
