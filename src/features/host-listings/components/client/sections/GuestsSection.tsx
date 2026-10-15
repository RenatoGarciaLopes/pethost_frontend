"use client";

import { Box, Checkbox, FormControlLabel, FormHelperText, Stack, Typography } from "@mui/material";
import { useId } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Counter } from "@/shared/ui/forms/Counter";
import { LISTING_SPECIES } from "../../../api/contracts";
import { listingCopy } from "../../../lib/listingCopy";
import { ListingSection, useListingSectionHost } from "./ListingSectionHost";

const copy = listingCopy.guests;
const CAPACITY_MAX = { person: 10, company: 200 } as const;
const SIZES = [
  ["acceptsSmall", copy.small],
  ["acceptsMedium", copy.medium],
  ["acceptsLarge", copy.large],
] as const;

function SpeciesField() {
  const id = useId();
  return (
    <Controller
      name="acceptedSpecies"
      render={({ field, fieldState }) => {
        const value: string[] = field.value;
        const toggle = (species: string, checked: boolean) =>
          field.onChange(LISTING_SPECIES.filter((item) => (item === species ? checked : value.includes(item))));
        return (
          <Box
            ref={field.ref}
            role="group"
            tabIndex={-1}
            aria-labelledby={id}
            aria-describedby={fieldState.error ? `${id}-erro` : undefined}
            sx={{ "&:focus": { outline: "none" } }}
          >
            <Typography id={id} sx={{ fontWeight: 700 }}>
              {copy.species}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" } }}>
              {LISTING_SPECIES.map((species) => (
                <FormControlLabel
                  key={species}
                  label={listingCopy.species[species]}
                  control={
                    <Checkbox
                      checked={value.includes(species)}
                      onChange={(event) => toggle(species, event.target.checked)}
                    />
                  }
                />
              ))}
            </Box>
            {fieldState.error && (
              <FormHelperText id={`${id}-erro`} error sx={{ mx: 0 }}>
                {fieldState.error.message}
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
}

function SizesField() {
  const id = useId();
  const species: string[] = useWatch({ name: "acceptedSpecies" });
  if (!species.includes("dog") && !species.includes("cat")) return null;
  return (
    <Controller
      name="acceptsSmall"
      render={({ fieldState }) => (
        <Box role="group" aria-labelledby={id} aria-describedby={fieldState.error ? `${id}-erro` : undefined}>
          <Typography id={id} sx={{ fontWeight: 700 }}>
            {copy.sizes}
          </Typography>
          {SIZES.map(([name, label]) => (
            <Controller
              key={name}
              name={name}
              render={({ field }) => (
                <FormControlLabel
                  label={label}
                  control={
                    <Checkbox
                      slotProps={{ input: { ref: name === "acceptsSmall" ? field.ref : undefined } }}
                      checked={Boolean(field.value)}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                />
              )}
            />
          ))}
          {fieldState.error && (
            <FormHelperText id={`${id}-erro`} error sx={{ mx: 0 }}>
              {fieldState.error.message}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}

/**
 * "Quem você recebe" (REQ-LIST-007): os 12 tipos (ao menos um); portes só com cachorro ou gato (e então ao menos um);
 * capacidade com "+" e "−" de 1 a 10 (pessoa física) ou 1 a 200 (empresa), "Somando todos os tutores".
 *
 * @example <GuestsSection />
 */
export function GuestsSection() {
  const { kind } = useListingSectionHost();
  return (
    <ListingSection id="guests">
      {() => (
        <>
          <SpeciesField />
          <SizesField />
          <Controller
            name="capacity"
            render={({ field, fieldState }) => (
              <Stack spacing={0.5}>
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
        </>
      )}
    </ListingSection>
  );
}
