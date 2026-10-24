"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useId, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { isApiError } from "@/shared/api/errors/ApiError";
import { translateCode, translateError } from "@/shared/api/errors/translateError";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { Notice } from "@/shared/ui/feedback/Notice";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import { diffProfile, needsCurrentPassword } from "../../lib/diffProfile";
import { accountCopy } from "../../lib/accountCopy";
import {
  profileFormSchema,
  toProfileFormValues,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../../schemas/profileFormSchema";
import type { AccountProfile, AccountProfilePatch, FieldEditability } from "../../types/accountProfile";
import {
  BirthDateProfileField,
  CpfProfileField,
  CurrentPasswordReveal,
  EmailField,
  PhoneField,
  ProfileTextField,
} from "./ProfileFields";

const { profile: copy } = accountCopy;

const ADDRESS_PARTS = ["zipCode", "street", "number", "complement", "neighborhood", "city", "state"] as const;
/** Campos que a API pode apontar num `VALIDATION_ERROR` e o formulário mostra (REQ-ACC-008). */
const API_FIELDS: FieldPath<ProfileFormValues>[] = [
  "fullName",
  "phone",
  "birthDate",
  "cpf",
  "currentPassword",
  "tradeName",
  ...ADDRESS_PARTS.map((part) => `address.${part}` as const),
  ...ADDRESS_PARTS.map((part) => `companyAddress.${part}` as const),
];
/** Identidade que a API pode travar no anfitrião (REQ-ACC-010). */
const HOST_IDENTITY = ["fullName", "birthDate", "cpf", "cnpj", "legalName"] as const;
/** Travas do tutor que só aparecem ao tentar salvar (REQ-ACC-007). */
const OWNER_LOCKS = { OWNER_CPF_LOCKED: "cpf", OWNER_BIRTH_DATE_LOCKED: "birthDate" } as const;

export interface ProfileFormProps {
  profile: AccountProfile;
  editability: FieldEditability;
  /** O PATCH (só o que mudou); a tela chama a mutação e devolve o perfil novo ou o erro. */
  save: (patch: AccountProfilePatch) => Promise<AccountProfile>;
  saving: boolean;
  onSaved: (profile: AccountProfile) => void;
}

/**
 * Formulário do perfil (REQ-ACC-003 a 013). Cada campo vem do `FieldEditability` do papel: livre, travado
 * com o motivo ou oculto. Manda só o que mudou; sem mudança, "Salvar" fica desligado com "Nada mudou
 * ainda.". Trava do tutor descoberta ao salvar desfaz só aquele campo e mantém as outras mudanças.
 *
 * @example <ProfileForm profile={profile} editability={gateway.editability(profile)} save={…} saving={…} onSaved={…} />
 */
export function ProfileForm({ profile, editability, save, saving, onSaved }: ProfileFormProps) {
  const notice = useErrorNotice();
  const [saved, setSaved] = useState(false);
  // Travas que a API revelou nesta visita (o tutor que já pagou); somam-se às do papel.
  const [discoveredLocks, setDiscoveredLocks] = useState<readonly ("cpf" | "birthDate")[]>([]);
  const [initial, setInitial] = useState(() => toProfileFormValues(profile));
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onTouched",
    defaultValues: initial,
  });
  const fields = withLocks(editability, discoveredLocks);
  const editable = Object.entries(fields).some(([name, { mode }]) => mode === "free" && name !== "avatarUrl");

  function restore(names: readonly (keyof ProfileFormValues)[]) {
    for (const name of names) form.setValue(name, initial[name], { shouldDirty: true });
  }

  function handleApiError(error: unknown) {
    if (!isApiError(error)) return notice.report(error);
    if (error.code === "OWNER_CPF_LOCKED" || error.code === "OWNER_BIRTH_DATE_LOCKED") {
      const field = OWNER_LOCKS[error.code];
      restore([field]);
      setDiscoveredLocks((locks) => [...locks, field]);
      return;
    }
    if (error.code === "OWNER_CPF_ALREADY_REGISTERED") {
      return form.setError("cpf", { type: "server", message: translateError(error) }, { shouldFocus: true });
    }
    if (error.code === "HOST_IDENTITY_LOCKED") {
      restore(HOST_IDENTITY);
      return notice.report(error);
    }
    if (error.code === "VALIDATION_ERROR") {
      if (error.fieldIssues.currentPassword) form.resetField("currentPassword");
      return applyFieldErrors(form.setError, error, { fields: API_FIELDS });
    }
    notice.report(error);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (saving) return;
    if (needsCurrentPassword(initial, values) && !values.currentPassword) {
      return form.setError("currentPassword", { message: copy.currentPasswordMissing }, { shouldFocus: true });
    }
    notice.clear();
    setSaved(false);
    try {
      const next = await save(diffProfile(initial, values));
      const nextValues = toProfileFormValues(next);
      setInitial(nextValues);
      form.reset(nextValues);
      setSaved(true);
      onSaved(next);
    } catch (error) {
      handleApiError(error);
    }
  });

  return (
    <FormProvider {...form}>
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          <ErrorNotice message={notice.message} tone={notice.tone} />
          {saved && <Notice tone="ok">{copy.saved}</Notice>}
          <EmailField editability={fields} />
          <ProfileTextField name="fullName" editability={fields} />
          <PhoneField editability={fields} />
          <BirthDateProfileField editability={fields} />
          <CpfProfileField editability={fields} />
          <CurrentPasswordReveal initial={initial} />
          <Section title={copy.address}>
            <AddressFields disabled={fields.address.mode !== "free" || saving} />
          </Section>
          {fields.tradeName.mode !== "hidden" && (
            <Section title={copy.company}>
              <ProfileTextField name="tradeName" editability={fields} />
              <ProfileTextField name="legalName" editability={fields} />
              <ProfileTextField name="cnpj" editability={fields} />
              <Typography component="h3" variant="subtitle1">
                {copy.companyAddress}
              </Typography>
              <AddressFields name="companyAddress" disabled={fields.companyAddress.mode !== "free" || saving} />
            </Section>
          )}
          {form.formState.errors.root?.server && (
            <Typography color="error" role="alert">
              {form.formState.errors.root.server.message}
            </Typography>
          )}
          {editable && <SaveButton control={form.control} initial={initial} busy={saving} blocked={notice.blocked} />}
        </Stack>
      </Box>
    </FormProvider>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack component="fieldset" spacing={2} sx={{ border: 0, m: 0, p: 0 }}>
      <Typography component="legend" variant="h3" sx={{ fontSize: 18, mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

/** Soma as travas descobertas ao salvar às do papel, com o motivo da API (REQ-ACC-007). */
function withLocks(editability: FieldEditability, locks: readonly ("cpf" | "birthDate")[]): FieldEditability {
  if (locks.length === 0) return editability;
  const reason = translateCode("OWNER_CPF_LOCKED");
  const locked = { mode: "locked", reason } as const;
  return { ...editability, ...Object.fromEntries(locks.map((field) => [field, locked])) };
}

/**
 * "Salvar" só liga quando algo mudou (REQ-ACC-006). Observa o formulário inteiro, mas isolado: só este
 * botão re-renderiza a cada tecla.
 */
function SaveButton({
  control,
  initial,
  busy,
  blocked,
}: {
  control: Control<ProfileFormInput, unknown, ProfileFormValues>;
  initial: ProfileFormValues;
  busy: boolean;
  blocked: boolean;
}) {
  const hintId = useId();
  const values = useWatch({ control }) as ProfileFormValues;
  const unchanged = Object.keys(diffProfile(initial, { ...initial, ...values, currentPassword: "" })).length === 0;
  return (
    <Stack spacing={1}>
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={unchanged || busy || blocked}
        aria-busy={busy}
        aria-describedby={unchanged ? hintId : undefined}
      >
        {busy ? copy.saving : copy.save}
      </Button>
      {unchanged && (
        <Typography id={hintId} variant="body2" color="text.secondary">
          {copy.nothingChanged}
        </Typography>
      )}
    </Stack>
  );
}
