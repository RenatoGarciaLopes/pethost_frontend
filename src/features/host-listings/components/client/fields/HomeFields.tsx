"use client";

import { FormHelperText, Stack, TextField } from "@mui/material";
import { Controller, useWatch } from "react-hook-form";
import { ChipPicker } from "@/shared/ui/forms/ChipPicker";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { HOME_TYPES } from "../../../api/contracts";
import { listingCopy } from "../../../lib/listingCopy";
import { HomeIllustration } from "./HomeIllustration";

const copy = listingCopy.home;
const HOME_OPTIONS = HOME_TYPES.map((value) => ({
  value,
  label: listingCopy.homeTypes[value],
  description: copy.homeTypeHelp[value],
  icon: <HomeIllustration type={value} />,
  orientation: "column" as const,
}));

/**
 * "Sua casa é…" (REQ-LIST-005): Casa · Apartamento em cartões grandes com desenho, lado a lado (um sobre o outro no
 * celular). Só pessoa física. Precisa de `FormProvider`.
 * @example {kind === "person" && <HomeTypeField />}
 */
export function HomeTypeField() {
  return (
    <Controller
      name="homeType"
      render={({ field, fieldState }) => (
        <Stack
          spacing={0.5}
          ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("input[type=radio]") ?? null)}
        >
          <ChoiceCardGroup
            label={copy.homeType}
            options={HOME_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            layout="responsive"
          />
          {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
        </Stack>
      )}
    />
  );
}

/**
 * Título do cantinho com a sugestão "Casa da {primeiro nome}" (ou "Apê da …", pelo tipo da casa) num chip de atalho:
 * tocar põe a sugestão no campo (REQ-LIST-005).
 * @example <TitleField firstName="Cida" />
 */
export function TitleField({ firstName }: { firstName: string }) {
  const homeType = useWatch({ name: "homeType" }) as string;
  const title = useWatch({ name: "title" }) as string;
  const suggestion = firstName ? copy.suggestedTitle(homeType, firstName) : null;
  return (
    <Controller
      name="title"
      render={({ field, fieldState }) => (
        <Stack spacing={1.5}>
          <TextField
            {...field}
            inputRef={field.ref}
            label={copy.title}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? copy.titleHelp}
            fullWidth
          />
          {suggestion && (
            <ChipPicker
              label={copy.titleSuggestion}
              options={[suggestion]}
              selected={title === suggestion ? [suggestion] : []}
              onPick={(picked) => field.onChange(picked)}
            />
          )}
        </Stack>
      )}
    />
  );
}

/**
 * "Conta como é a sua casa", com as perguntas-guia no apoio (REQ-LIST-005).
 * @example <DescriptionField />
 */
export function DescriptionField() {
  return (
    <Controller
      name="description"
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          inputRef={field.ref}
          label={copy.description}
          multiline
          minRows={5}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? copy.descriptionHelp}
          fullWidth
        />
      )}
    />
  );
}
