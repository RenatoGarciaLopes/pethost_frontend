"use client";

import { Box, Button, FormHelperText, Stack, TextField } from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { HOME_TYPES } from "../../../api/contracts";
import { listingCopy } from "../../../lib/listingCopy";
import { ListingSection, useListingSectionHost } from "./ListingSectionHost";
import { ListingYesNo } from "./ListingYesNo";

const copy = listingCopy.home;
const HOME_OPTIONS = HOME_TYPES.map((value) => ({ value, label: listingCopy.homeTypes[value] }));

/**
 * "Sua casa" (REQ-LIST-005): tipo (Casa · Apartamento, só pessoa física), quintal, título (com a sugestão "Casa da
 * {primeiro nome}" ou "Apê da …") e descrição com perguntas-guia.
 *
 * @example <HomeSection />
 */
export function HomeSection() {
  const { kind, firstName } = useListingSectionHost();
  return (
    <ListingSection id="home">
      {(form) => (
        <>
          {kind === "person" && (
            <Controller
              name="homeType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Stack
                  spacing={0.5}
                  ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("button[role=radio]") ?? null)}
                >
                  <SegmentedControl
                    label={copy.homeType}
                    options={HOME_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
                </Stack>
              )}
            />
          )}
          <ListingYesNo name="hasYard" label={copy.hasYard} />
          <TitleField firstName={firstName} />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                inputRef={field.ref}
                label={copy.description}
                multiline
                minRows={4}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? copy.descriptionHelp}
                fullWidth
              />
            )}
          />
        </>
      )}
    </ListingSection>
  );
}

function TitleField({ firstName }: { firstName: string }) {
  const homeType = useWatch({ name: "homeType" }) as string;
  const title = useWatch({ name: "title" }) as string;
  const suggestion = firstName ? copy.suggestedTitle(homeType, firstName) : null;
  return (
    <Controller
      name="title"
      render={({ field, fieldState }) => (
        <Stack spacing={1}>
          <TextField
            {...field}
            inputRef={field.ref}
            label={copy.title}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? copy.titleHelp}
            fullWidth
          />
          {suggestion && suggestion !== title && (
            <Box>
              <Button variant="quiet" size="small" onClick={() => field.onChange(suggestion)}>
                {copy.titleSuggestion(suggestion)}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    />
  );
}
