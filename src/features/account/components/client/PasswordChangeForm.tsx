"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { isApiError } from "@/shared/api/errors/ApiError";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { forgotPasswordPath } from "@/shared/config/appRoutes";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { isStrongPassword } from "@/shared/lib/validation/password";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { Notice } from "@/shared/ui/feedback/Notice";
import { PasswordField } from "@/shared/ui/forms/PasswordField";
import { PasswordStrengthChecklist } from "@/shared/ui/forms/PasswordStrengthChecklist";
import { useChangePasswordMutation } from "../../hooks/useChangePasswordMutation";
import { accountCopy } from "../../lib/accountCopy";
import { passwordChangeSchema, type PasswordChangeValues } from "../../schemas/passwordChangeSchema";

const { password: copy } = accountCopy;
const EMPTY: PasswordChangeValues = { currentPassword: "", newPassword: "" };

/**
 * Trocar a senha logado (REQ-ACC-018 a 021). Envia uma vez; com sucesso limpa os campos e confirma, e a
 * pessoa segue logada (o BFF regrava os cookies). Senha atual errada (400 no campo) limpa só ela.
 * As senhas ficam só no formulário (REQ-ACC-026).
 *
 * @example <PasswordChangeForm role="owner" />
 */
export function PasswordChangeForm({ role }: { role: PersonalRole }) {
  const mutation = useChangePasswordMutation();
  const notice = useErrorNotice();
  const [done, setDone] = useState(false);
  const { control, handleSubmit, setError, reset, resetField, formState } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: "onTouched",
    defaultValues: EMPTY,
  });

  function handleApiError(error: unknown) {
    if (isApiError(error) && error.code === "VALIDATION_ERROR") {
      if (error.fieldErrors.currentPassword) resetField("currentPassword");
      return applyFieldErrors(setError, error, { fields: ["currentPassword", "newPassword"] });
    }
    notice.report(error);
  }

  const onSubmit = handleSubmit((values) => {
    if (mutation.isPending) return;
    notice.clear();
    setDone(false);
    mutation.mutate(values, {
      onSuccess: () => {
        reset(EMPTY);
        setDone(true);
      },
      onError: handleApiError,
    });
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 34 } }}>
        {copy.title}
      </Typography>
      <Notice tone="info">{copy.otherDevices}</Notice>
      <ErrorNotice message={notice.message} tone={notice.tone} />
      {done && <Notice tone="ok">{copy.done}</Notice>}
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { ref, ...field }, fieldState }) => (
                <PasswordField
                  {...field}
                  inputRef={ref}
                  label={copy.current}
                  autoComplete="current-password"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />
            <Link component={NextLink} href={forgotPasswordPath(role)} sx={{ alignSelf: "flex-start" }}>
              {copy.forgot}
            </Link>
          </Stack>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { ref, ...field }, fieldState }) => (
              <Stack spacing={1.5}>
                <PasswordField
                  {...field}
                  inputRef={ref}
                  label={copy.next}
                  autoComplete="new-password"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
                <PasswordStrengthChecklist password={field.value} />
              </Stack>
            )}
          />
          {formState.errors.root?.server && (
            <Typography color="error" role="alert">
              {formState.errors.root.server.message}
            </Typography>
          )}
          <SubmitButton control={control} busy={mutation.isPending} blocked={notice.blocked} />
        </Stack>
      </Box>
    </Stack>
  );
}

/** Só libera com senha atual preenchida e a nova forte; observa só os dois campos (REQ-ACC-018). */
function SubmitButton({
  control,
  busy,
  blocked,
}: {
  control: Control<PasswordChangeValues>;
  busy: boolean;
  blocked: boolean;
}) {
  const [currentPassword, newPassword] = useWatch({ control, name: ["currentPassword", "newPassword"] });
  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={!currentPassword || !isStrongPassword(newPassword) || busy || blocked}
      aria-busy={busy}
    >
      {busy ? copy.submitting : copy.submit}
    </Button>
  );
}
