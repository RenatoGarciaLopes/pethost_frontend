"use client";

import { FormHelperText, Stack, Typography } from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CheckCardGroup } from "@/shared/ui/forms/CheckCardGroup";
import { Counter } from "@/shared/ui/forms/Counter";
import { LISTING_SPECIES } from "../../../api/contracts";
import { listingCopy } from "../../../lib/listingCopy";
import type { HostKind } from "../../../types";

const copy = listingCopy.guests;
const CAPACITY_MAX = { person: 10, company: 200 } as const;
const SPECIES_OPTIONS = LISTING_SPECIES.map((value) =>
  value === "exotic" ? { value, ...copy.exotic } : { value, label: listingCopy.species[value] },
);
const SIZES = ["small", "medium", "large"] as const;
const SIZE_FIELD = { small: "acceptsSmall", medium: "acceptsMedium", large: "acceptsLarge" } as const;
const SIZE_OPTIONS = SIZES.map((value) => ({ value, label: copy[value], description: copy.sizeHelp[value] }));

/**
 * "Que bichos você recebe?" (REQ-LIST-007): os 12 tipos em cartões compactos de marcar, cachorro e gato primeiro;
 * ao menos um. Precisa de `FormProvider`.
 * @example <SpeciesField />
 */
export function SpeciesField() {
  return (
    <Controller
      name="acceptedSpecies"
      render={({ field, fieldState }) => (
        <CheckCardGroup
          ref={field.ref}
          label={copy.species}
          options={SPECIES_OPTIONS}
          value={field.value}
          onChange={field.onChange}
          density="compact"
          columns={{ xs: 2, md: 3 }}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

/**
 * Portes de cachorro e gato (REQ-LIST-007), em três cartões com o peso; só aparecem com cachorro ou gato marcado, e
 * então ao menos um. Guarda nos três campos da API (`acceptsSmall`, `acceptsMedium`, `acceptsLarge`).
 * @example <SizesField />
 */
export function SizesField() {
  const { setValue, trigger } = useFormContext();
  const species: string[] = useWatch({ name: "acceptedSpecies" });
  const checked = useWatch({ name: ["acceptsSmall", "acceptsMedium", "acceptsLarge"] }) as boolean[];
  if (!species.includes("dog") && !species.includes("cat")) return null;
  return (
    <Controller
      name="acceptsSmall"
      render={({ field, fieldState }) => (
        <CheckCardGroup
          ref={field.ref}
          label={copy.sizes}
          options={SIZE_OPTIONS}
          value={SIZES.filter((_, index) => checked[index])}
          onChange={(next) => {
            for (const size of SIZES) setValue(SIZE_FIELD[size], next.includes(size), { shouldDirty: true });
            // O erro dos portes mora no primeiro campo (`acceptsSmall`): confere de novo só se já estava aparecendo.
            if (fieldState.invalid) void trigger("acceptsSmall");
          }}
          columns={{ xs: 1, sm: 3 }}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

/**
 * "Quantos pets ao mesmo tempo?" no contador, de 1 a 10 (pessoa física) ou 1 a 200 (empresa), "Somando todos os
 * tutores" (REQ-LIST-007).
 * @example <CapacityField kind="person" />
 */
export function CapacityField({ kind }: { kind: HostKind }) {
  return (
    <Controller
      name="capacity"
      render={({ field, fieldState }) => (
        <Stack spacing={0.75}>
          <Counter
            label={copy.capacity}
            value={field.value}
            min={1}
            max={CAPACITY_MAX[kind]}
            onChange={field.onChange}
          />
          <Typography variant="body2" color="text.secondary">
            {copy.capacityHelp}
          </Typography>
          {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
        </Stack>
      )}
    />
  );
}
