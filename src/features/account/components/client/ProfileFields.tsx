"use client";

import { Button, InputAdornment, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { Controller, useFormContext, useWatch, type ControllerFieldState } from "react-hook-form";
import { maskCnpj, maskCpf, maskDate, maskPhone } from "@/shared/lib/masks";
import { maskCpfForDisplay } from "@/shared/lib/masks/maskCpfForDisplay";
import { BirthDateField } from "@/shared/ui/forms/BirthDateField";
import { CpfField } from "@/shared/ui/forms/CpfField";
import { LockedField } from "@/shared/ui/forms/LockedField";
import { MaskedTextField } from "@/shared/ui/forms/MaskedTextField";
import { PasswordField } from "@/shared/ui/forms/PasswordField";
import { needsCurrentPassword } from "../../lib/diffProfile";
import { accountCopy } from "../../lib/accountCopy";
import type { ProfileFormValues } from "../../schemas/profileFormSchema";
import type { FieldEditability } from "../../types/accountProfile";

const { profile: copy } = accountCopy;

/** Campos de texto simples do perfil, com rótulo, máscara de exibição quando travado e `autocomplete`. */
const TEXT_FIELDS = {
  fullName: { label: copy.fullName, autoComplete: "name", display: (value: string) => value },
  tradeName: { label: copy.tradeName, autoComplete: "organization", display: (value: string) => value },
  legalName: { label: copy.legalName, autoComplete: "off", display: (value: string) => value },
  cnpj: { label: copy.cnpj, autoComplete: "off", display: maskCnpj },
} as const;

type TextFieldName = keyof typeof TEXT_FIELDS;

/** Props comuns de um campo ligado ao RHF: `inputRef` no `<input>` (o foco do erro precisa dele). */
function bind(
  field: { name: string; onBlur: () => void; ref: (element: HTMLInputElement | null) => void },
  fieldState: ControllerFieldState,
) {
  return {
    name: field.name,
    onBlur: field.onBlur,
    inputRef: field.ref,
    error: Boolean(fieldState.error),
    helperText: fieldState.error?.message,
    fullWidth: true,
  };
}

/**
 * Um campo de texto do perfil: livre vira `TextField`, travado vira `LockedField` com o motivo
 * (REQ-ACC-009), oculto não aparece.
 */
export function ProfileTextField({ name, editability }: { name: TextFieldName; editability: FieldEditability }) {
  const { control } = useFormContext<ProfileFormValues>();
  const { mode, reason = "" } = editability[name];
  const { label, autoComplete, display } = TEXT_FIELDS[name];
  if (mode === "hidden") return null;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) =>
        mode === "locked" ? (
          <LockedField label={label} value={display(field.value)} reason={reason} fullWidth />
        ) : (
          <TextField
            {...bind(field, fieldState)}
            value={field.value}
            onChange={field.onChange}
            label={label}
            autoComplete={autoComplete}
            required
          />
        )
      }
    />
  );
}

/** E-mail: sempre travado, é o login (REQ-ACC-003). */
export function EmailField({ editability }: { editability: FieldEditability }) {
  const { getValues } = useFormContext<ProfileFormValues>();
  return (
    <LockedField label={copy.email} value={getValues("email")} reason={editability.email.reason ?? ""} fullWidth />
  );
}

/** Celular: livre para os dois papéis. */
export function PhoneField({ editability }: { editability: FieldEditability }) {
  const { control } = useFormContext<ProfileFormValues>();
  const { mode, reason = "" } = editability.phone;
  if (mode === "hidden") return null;
  return (
    <Controller
      control={control}
      name="phone"
      render={({ field, fieldState }) =>
        mode === "locked" ? (
          <LockedField label={copy.phone} value={maskPhone(field.value)} reason={reason} fullWidth />
        ) : (
          <MaskedTextField
            {...bind(field, fieldState)}
            mask="phone"
            value={field.value}
            onValueChange={field.onChange}
            label={copy.phone}
            autoComplete="tel"
            required
          />
        )
      }
    />
  );
}

/** Nascimento: livre no tutor até o primeiro pagamento; travado no anfitrião verificado. */
export function BirthDateProfileField({ editability }: { editability: FieldEditability }) {
  const { control } = useFormContext<ProfileFormValues>();
  const { mode, reason = "" } = editability.birthDate;
  if (mode === "hidden") return null;
  return (
    <Controller
      control={control}
      name="birthDate"
      render={({ field, fieldState }) =>
        mode === "locked" ? (
          <LockedField label={copy.birthDate} value={maskDate(field.value)} reason={reason} fullWidth />
        ) : (
          <BirthDateField
            {...bind(field, fieldState)}
            value={field.value}
            onValueChange={field.onChange}
            label={copy.birthDate}
          />
        )
      }
    />
  );
}

/**
 * CPF mascarado na tela ("***.***.247-25") até tocar "Mostrar" (REQ-ACC-013). Mostrado: editável (tutor)
 * ou travado com o motivo. Com erro vindo da API, o campo abre sozinho para a pessoa ver o que corrigir.
 */
export function CpfProfileField({ editability }: { editability: FieldEditability }) {
  const { control } = useFormContext<ProfileFormValues>();
  const [shown, setShown] = useState(false);
  const { mode, reason = "" } = editability.cpf;
  if (mode === "hidden") return null;

  const toggle = (
    <InputAdornment position="end">
      <Button size="small" onClick={() => setShown((value) => !value)}>
        {shown ? copy.hideCpf : copy.showCpf}
      </Button>
    </InputAdornment>
  );

  return (
    <Controller
      control={control}
      name="cpf"
      render={({ field, fieldState }) => {
        if (!shown && !fieldState.error)
          return (
            <TextField
              label={copy.cpf}
              value={maskCpfForDisplay(field.value)}
              helperText={mode === "locked" ? reason : undefined}
              fullWidth
              slotProps={{ input: { readOnly: true, endAdornment: toggle } }}
            />
          );
        if (mode === "locked")
          return (
            <LockedField
              label={copy.cpf}
              value={maskCpf(field.value)}
              reason={reason}
              fullWidth
              slotProps={{ input: { endAdornment: toggle } }}
            />
          );
        return (
          <CpfField
            {...bind(field, fieldState)}
            value={field.value}
            onValueChange={field.onChange}
            label={copy.cpf}
            slotProps={{ input: { endAdornment: toggle } }}
          />
        );
      }}
    />
  );
}

/**
 * "Sua senha atual" só aparece quando CPF ou nascimento mudaram (REQ-ACC-005). Não puxa o foco (a pessoa
 * ainda está digitando o CPF); a ajuda é anunciada pela região do próprio bloco.
 */
export function CurrentPasswordReveal({ initial }: { initial: ProfileFormValues }) {
  const { control } = useFormContext<ProfileFormValues>();
  const [cpf, birthDate] = useWatch({ control, name: ["cpf", "birthDate"] });
  const needed = needsCurrentPassword(initial, { ...initial, cpf, birthDate });

  return (
    <Stack aria-live="polite">
      {needed && (
        <Controller
          control={control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <PasswordField
              {...bind(field, fieldState)}
              helperText={fieldState.error?.message ?? copy.currentPasswordHelp}
              value={field.value ?? ""}
              onChange={field.onChange}
              label={copy.currentPassword}
              autoComplete="current-password"
              required
            />
          )}
        />
      )}
    </Stack>
  );
}
