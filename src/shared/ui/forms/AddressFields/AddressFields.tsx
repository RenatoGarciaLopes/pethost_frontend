"use client";
import { Box, CircularProgress, InputAdornment, TextField, Typography } from "@mui/material";
import { useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useCepLookup } from "../../../hooks/useCepLookup";
import { BRAZIL_STATES } from "../../../lib/address";
import { MaskedTextField } from "../MaskedTextField";
import { formCopy } from "../formCopy";

export interface AddressFieldsProps {
  /** Prefixo dos campos no formulário (padrão `address`: `address.zipCode`, `address.street`...). */
  name?: string;
  /** Desliga todos os campos (ex.: enquanto o formulário envia). */
  disabled?: boolean;
}

/** Campos que o CEP preenche, na ordem do endereço sugerido pelo ViaCEP. */
const AUTOFILL = ["street", "neighborhood", "city", "state"] as const;
const copy = formCopy.address;

/**
 * Endereço brasileiro completo dentro de um formulário React Hook Form (precisa de `FormProvider`).
 * O CEP vem primeiro: com 8 dígitos, consulta o ViaCEP (`useCepLookup`) e preenche rua, bairro,
 * cidade e UF **só nos campos que a pessoa não editou**. CEP não achado, falha ou demora (4 s):
 * avisa e libera os campos. Os outros campos ficam travados até a busca terminar, a não ser que
 * já tenham valor (voltando de outro passo). As mensagens de erro vêm do schema (`createAddressSchema`).
 * Só o CEP é observado (`useWatch`): digitar nos outros campos não renderiza o grupo de novo.
 *
 * @example
 * <FormProvider {...form}>
 *   <AddressFields />
 * </FormProvider>
 */
export function AddressFields({ name = "address", disabled = false }: AddressFieldsProps) {
  const { control, resetField, getFieldState, getValues } = useFormContext();
  const zipCode: string = useWatch({ control, name: `${name}.zipCode` }) ?? "";
  const lookup = useCepLookup(zipCode);
  const found = lookup.status === "found" ? lookup.address : null;

  // Sugestão do CEP: nunca apaga o que a pessoa digitou. A sugestão vira o valor padrão do campo
  // (`resetField`), então só edição de verdade deixa o campo "sujo", e a regra vale mesmo voltando de outro passo.
  useEffect(() => {
    if (!found) return;
    for (const key of AUTOFILL) {
      const path = `${name}.${key}`;
      if (!getFieldState(path).isDirty) resetField(path, { defaultValue: found[key], keepTouched: true });
    }
  }, [found, name, getFieldState, resetField]);

  const settled = lookup.status === "found" || lookup.status === "notFound";
  const alreadyFilled = AUTOFILL.some((key) => Boolean(getValues(`${name}.${key}`)));
  const locked = disabled || !(settled || alreadyFilled);

  const text = (field: "street" | "number" | "complement" | "neighborhood" | "city", autoComplete?: string) => (
    <Controller
      control={control}
      name={`${name}.${field}`}
      // `ref` no <input> (inputRef): o foco de erro da API precisa dele (REQ-OREG-009).
      render={({ field: { ref, ...input }, fieldState }) => (
        <TextField
          {...input}
          inputRef={ref}
          value={input.value ?? ""}
          label={copy[field]}
          autoComplete={autoComplete}
          disabled={locked}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? (field === "number" ? copy.numberHelp : undefined)}
          fullWidth
        />
      )}
    />
  );

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
      <Box sx={{ gridColumn: { sm: "1 / 2" } }}>
        <Controller
          control={control}
          name={`${name}.zipCode`}
          render={({ field: input, fieldState }) => (
            <MaskedTextField
              name={input.name}
              inputRef={input.ref}
              onBlur={input.onBlur}
              value={input.value ?? ""}
              onValueChange={input.onChange}
              mask="cep"
              label={copy.zipCode}
              autoComplete="postal-code"
              disabled={disabled}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
              fullWidth
              slotProps={{
                htmlInput: { "aria-busy": lookup.status === "loading" },
                input: {
                  endAdornment:
                    lookup.status === "loading" ? (
                      <InputAdornment position="end">
                        <CircularProgress size={20} aria-hidden />
                      </InputAdornment>
                    ) : undefined,
                },
              }}
            />
          )}
        />
      </Box>
      <Typography role="status" variant="body2" sx={{ gridColumn: "1 / -1", "&:empty": { display: "none" } }}>
        {lookup.status === "loading" ? copy.searching : lookup.status === "notFound" ? copy.notFound : ""}
      </Typography>
      <Box sx={{ gridColumn: "1 / -1" }}>{text("street", "address-line1")}</Box>
      {text("number")}
      {text("complement", "address-line2")}
      <Box sx={{ gridColumn: "1 / -1" }}>{text("neighborhood", "address-level3")}</Box>
      {text("city", "address-level2")}
      <Controller
        control={control}
        name={`${name}.state`}
        render={({ field: { ref, ...input }, fieldState }) => (
          <TextField
            {...input}
            inputRef={ref}
            value={input.value ?? ""}
            select
            label={copy.state}
            autoComplete="address-level1"
            disabled={locked}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">{copy.statePlaceholder}</option>
            {BRAZIL_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </TextField>
        )}
      />
    </Box>
  );
}
