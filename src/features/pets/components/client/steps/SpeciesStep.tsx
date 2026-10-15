"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Hint } from "@/shared/ui/feedback/Hint";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { PET_SPECIES } from "../../../api/contracts";
import { speciesLabel } from "../../../lib/describePet";
import { petEditCopy } from "../../../lib/petEditCopy";
import { petWizardCopy } from "../../../lib/petWizardCopy";
import { requiresDescription } from "../../../lib/species";
import { speciesChangeEffects } from "../../../lib/speciesChangeEffects";
import { petStepSchemas, speciesSectionSchema } from "../../../schemas/petProfileSchema";
import type { PetSpecies } from "../../../types";
import { usePetStep } from "./PetStepHost";
import { SizeField } from "./SizeField";
import { StepForm } from "./StepForm";
import { useServerErrors } from "./useServerErrors";

const copy = petWizardCopy.species;
type Values = z.input<typeof speciesSectionSchema>;
type Accepted = z.output<typeof speciesSectionSchema>;

/** Cachorro e gato primeiro, "Outro bicho" por último: a ordem de `PET_SPECIES` (REQ-PNEW-002). */
const OPTIONS = PET_SPECIES.map((species) => ({ value: species, label: speciesLabel(species, null) }));

/**
 * Passo 1, "Que bicho é o seu?" (REQ-PNEW-002, 003): os 12 bichos; exótico pede "Que bicho é?". Na edição
 * (REQ-PEDIT-007), virar cachorro pede o porte aqui mesmo e a seção avisa o que sai da ficha antes de salvar.
 * No assistente o porte fica no passo do corpo e a dica de remoção aparece depois de aceitar.
 *
 * @example <SpeciesStep />
 */
export function SpeciesStep() {
  const { values, accept, mode } = usePetStep();
  const { control, handleSubmit, setError, formState } = useForm<Values, unknown, Accepted>({
    // No assistente o porte é do passo do corpo; na edição, virar cachorro pede o porte aqui.
    resolver: zodResolver(mode === "section" ? speciesSectionSchema : petStepSchemas.species),
    defaultValues: { species: values.species, speciesDescription: values.speciesDescription ?? "", size: values.size },
  });
  useServerErrors(setError, ["species", "speciesDescription", "size"]);
  const species = useWatch({ control, name: "species" }) as PetSpecies | undefined;
  const effects =
    mode === "section" && values.species && species ? speciesChangeEffects(values.species, species) : null;
  const removed = effects?.removes.filter((field) => values[field] !== undefined) ?? [];

  function submit({ species: chosen, speciesDescription, size }: Accepted) {
    if (mode === "wizard")
      return accept(requiresDescription(chosen) ? { species: chosen, speciesDescription } : { species: chosen });
    accept({ species: chosen, speciesDescription, size });
  }

  return (
    <StepForm dirty={formState.isDirty} title={copy.title} onSubmit={handleSubmit(submit)}>
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
        {effects?.requires.includes("size") && (
          <Controller control={control} name="size" render={(props) => <SizeField {...props} />} />
        )}
        {species && removed.length > 0 && (
          <Hint>
            {removed.map((field) => petEditCopy.speciesRemoves[field](speciesLabel(species, null))).join(" ")}
          </Hint>
        )}
      </Stack>
    </StepForm>
  );
}
