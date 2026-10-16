"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { isApiError } from "@/shared/api/errors/ApiError";
import { isStrongPassword } from "@/shared/lib/validation/password";
import { PasswordField } from "@/shared/ui/forms/PasswordField";
import { PasswordStrengthChecklist } from "@/shared/ui/forms/PasswordStrengthChecklist";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { useResetPasswordMutation } from "../../hooks/usePasswordMutations";
import { passwordCopy } from "../../lib/passwordCopy";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  type ResetPasswordValues,
} from "../../schemas/resetPasswordSchema";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { PageHeader } from "@/shared/ui/layout/PageHeader";

const { reset } = passwordCopy;

export interface ResetPasswordFormProps {
  /** Token do link, só em memória (REQ-PWD-005). */
  token: string;
  onDone: () => void;
  /** A API recusou o token: `expired` (401, REQ-PWD-010) ou `missing` (400 no campo `token`, REQ-PWD-006). */
  onTokenRejected: (reason: "expired" | "missing") => void;
}

/**
 * Senha nova (REQ-PWD-007 a 012): `PasswordField` com a régua viva; o envio só libera com as 5 regras e
 * acontece uma vez. Senha fraca para a API fica no campo e o token continua valendo.
 * Só o bloco da senha re-renderiza a cada tecla (a régua mora dentro do `Controller`).
 *
 * @example <ResetPasswordForm token={token} onDone={…} onTokenRejected={…} />
 */
export function ResetPasswordForm({ token, onDone, onTokenRejected }: ResetPasswordFormProps) {
  const mutation = useResetPasswordMutation();
  const notice = useErrorNotice();
  const { control, handleSubmit, setError, formState } = useForm<ResetPasswordInput, unknown, ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "" },
  });

  function handleApiError(error: unknown) {
    if (!isApiError(error)) return notice.report(error);
    if (error.code === "AUTH_PASSWORD_RESET_TOKEN_INVALID") return onTokenRejected("expired");
    if (error.code === "VALIDATION_ERROR") {
      if (error.fieldErrors.token) return onTokenRejected("missing");
      return applyFieldErrors(setError, error, { fields: ["newPassword"] });
    }
    notice.report(error);
  }

  const onSubmit = handleSubmit(({ newPassword }) => {
    if (mutation.isPending) return;
    notice.clear();
    mutation.mutate({ token, newPassword }, { onSuccess: onDone, onError: handleApiError });
  });

  return (
    <Stack spacing={3}>
      <PageHeader title={reset.title} />
      <ErrorNotice message={notice.message} tone={notice.tone} />
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { ref, ...field }, fieldState }) => (
              <Stack spacing={1.5}>
                <PasswordField
                  {...field}
                  inputRef={ref}
                  label={reset.password}
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

/** Botão que só libera com a senha forte (REQ-PWD-007); observa só a senha, isolado do resto do formulário. */
function SubmitButton({
  control,
  busy,
  blocked,
}: {
  control: Control<ResetPasswordInput, unknown, ResetPasswordValues>;
  busy: boolean;
  blocked: boolean;
}) {
  const newPassword = useWatch({ control, name: "newPassword" });
  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={!isStrongPassword(newPassword) || busy || blocked}
      aria-busy={busy}
    >
      {busy ? reset.submitting : reset.submit}
    </Button>
  );
}
