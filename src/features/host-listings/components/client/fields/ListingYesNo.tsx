"use client";

import { Box, FormHelperText } from "@mui/material";
import { Controller } from "react-hook-form";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { listingCopy as copy } from "../../../lib/listingCopy";

const OPTIONS = [
  { value: "yes", label: copy.yes },
  { value: "no", label: copy.no },
] as const;

/**
 * Sim/Não obrigatório de um campo booleano do cantinho (quintal, quem mora na casa), na pílula larga do cadastro (até
 * 480 px). Sem resposta, nada vem marcado. Precisa de `FormProvider`.
 * @example <ListingYesNo name="hasYard" label="Tem quintal?" />
 */
export function ListingYesNo({ name, label }: { name: "hasYard" | "hasDogs" | "hasCats" | "hasKids"; label: string }) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <Box
          sx={{ maxWidth: 480 }}
          ref={(node: HTMLDivElement | null) => field.ref(node?.querySelector("button[role=radio]") ?? null)}
        >
          <SegmentedControl
            label={label}
            options={OPTIONS}
            value={field.value === true ? "yes" : field.value === false ? "no" : ""}
            onChange={(value) => field.onChange(value === "yes")}
            fullWidth
          />
          {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
        </Box>
      )}
    />
  );
}
