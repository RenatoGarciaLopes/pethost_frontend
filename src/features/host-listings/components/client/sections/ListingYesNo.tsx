"use client";

import { FormHelperText, Stack } from "@mui/material";
import { Controller } from "react-hook-form";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { listingCopy as copy } from "../../../lib/listingCopy";

const OPTIONS = [
  { value: "yes", label: copy.yes },
  { value: "no", label: copy.no },
] as const;

/**
 * Sim/Não obrigatório de um campo booleano do cantinho (quintal, quem mora na casa). Sem resposta, nada vem marcado.
 * @example <ListingYesNo name="hasYard" label="Tem quintal?" />
 */
export function ListingYesNo({ name, label }: { name: "hasYard" | "hasDogs" | "hasCats" | "hasKids"; label: string }) {
  return (
    <Controller
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
          {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
        </Stack>
      )}
    />
  );
}
