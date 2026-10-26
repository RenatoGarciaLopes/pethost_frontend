"use client";

import { FormHelperText, Stack } from "@mui/material";
import type { ControllerFieldState, ControllerRenderProps } from "react-hook-form";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { petWizardCopy } from "../../../lib/petWizardCopy";

const copy = petWizardCopy.body;
const SIZE_OPTIONS = (["small", "medium", "large"] as const).map((value) => ({ value, label: copy.sizes[value] }));

export interface SizeFieldProps {
  field: Pick<ControllerRenderProps, "value" | "onChange" | "ref">;
  fieldState: ControllerFieldState;
}

/**
 * Porte do cachorro (P, M, G) com a régua de peso na ajuda, para o `render` de um `Controller` do campo `size`.
 * Usado no passo do corpo (REQ-PNEW-004) e na seção "Bicho" da edição quando o pet vira cachorro (REQ-PEDIT-007).
 *
 * @example <Controller control={control} name="size" render={(props) => <SizeField {...props} />} />
 */
export function SizeField({ field, fieldState }: SizeFieldProps) {
  return (
    <Stack
      spacing={0.5}
      ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("input[type=radio]") ?? null)}
    >
      <ChoiceCardGroup
        label={copy.size}
        options={SIZE_OPTIONS}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={field.onChange}
      />
      <FormHelperText error={Boolean(fieldState.error)} role={fieldState.error ? "alert" : undefined}>
        {fieldState.error?.message ?? copy.sizeHelp}
      </FormHelperText>
    </Stack>
  );
}
