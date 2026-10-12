"use client";

import { Stack, TextField } from "@mui/material";
import { Controller, useFormContext, type ControllerFieldState, type ControllerRenderProps } from "react-hook-form";
import { BirthDateField } from "@/shared/ui/forms/BirthDateField";
import { CpfField } from "@/shared/ui/forms/CpfField";
import { MaskedTextField } from "@/shared/ui/forms/MaskedTextField";
import { PasswordField } from "@/shared/ui/forms/PasswordField";
import { PasswordStrengthChecklist } from "@/shared/ui/forms/PasswordStrengthChecklist";
import { registrationCopy } from "../../lib/registrationCopy";
import type { OwnerRegistrationInput } from "../../schemas/ownerRegistrationSchema";

const { fields, passwordRules } = registrationCopy;

type StringField = Exclude<keyof OwnerRegistrationInput, "address">;

/**
 * Props comuns de um campo ligado ao RHF: `inputRef` no `<input>` (o foco de erro precisa dele;
 * o `ref` do `TextField` cai na caixa de fora), erro e ajuda. Sem erro, mostra a ajuda do campo.
 */
function bind(
  field: ControllerRenderProps<OwnerRegistrationInput, StringField>,
  fieldState: ControllerFieldState,
  help?: string,
) {
  return {
    name: field.name,
    onBlur: field.onBlur,
    inputRef: field.ref,
    error: Boolean(fieldState.error),
    helperText: fieldState.error?.message ?? help,
    fullWidth: true,
    required: true,
  };
}

/**
 * Passo 1, "Primeiro, você" (REQ-OREG-002): nome, e-mail, senha com a régua viva, celular,
 * nascimento e CPF. Teclado e `autocomplete` certos em cada campo (REQ-OREG-016).
 */
export function PersonStep() {
  const { control } = useFormContext<OwnerRegistrationInput>();

  return (
    <Stack spacing={3}>
      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <TextField
            {...bind(field, fieldState)}
            value={field.value}
            onChange={field.onChange}
            label={fields.fullName}
            autoComplete="name"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            {...bind(field, fieldState)}
            value={field.value}
            onChange={field.onChange}
            label={fields.email}
            type="email"
            autoComplete="email"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <Stack spacing={1.5}>
            <PasswordField
              {...bind(field, fieldState)}
              value={field.value}
              onChange={field.onChange}
              label={fields.password}
              autoComplete="new-password"
            />
            {/* A régua lê o valor do próprio campo: só este bloco re-renderiza a cada tecla (REQ-OREG-004). */}
            <PasswordStrengthChecklist password={field.value} labels={passwordRules} />
          </Stack>
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <MaskedTextField
            {...bind(field, fieldState)}
            mask="phone"
            value={field.value}
            onValueChange={field.onChange}
            label={fields.phone}
            autoComplete="tel"
          />
        )}
      />
      <Controller
        control={control}
        name="birthDate"
        render={({ field, fieldState }) => (
          <BirthDateField
            {...bind(field, fieldState, fields.birthDateHelp)}
            value={field.value}
            onValueChange={field.onChange}
            label={fields.birthDate}
          />
        )}
      />
      <Controller
        control={control}
        name="cpf"
        render={({ field, fieldState }) => (
          <CpfField
            {...bind(field, fieldState, fields.cpfHelp)}
            value={field.value}
            onValueChange={field.onChange}
            label={fields.cpf}
          />
        )}
      />
    </Stack>
  );
}
