"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { Controller, useForm } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import type { PersonalRole, SessionUser } from "@/shared/auth/contracts/session";
import { forgotPasswordPath } from "@/shared/config/appRoutes";
import { roleLabel } from "@/shared/config/roleLabels";
import { PasswordField } from "@/shared/ui/forms/PasswordField";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { useSwitchAccountMutation } from "../../hooks/useSwitchAccountMutation";
import { switchCopy } from "../../lib/switchCopy";
import { switchAccountSchema, type SwitchAccountValues } from "../../schemas/switchAccountSchema";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";

export interface SwitchPasswordFormProps {
  target: PersonalRole;
  /** "Agora não": de volta para onde a pessoa estava, ou a casa da conta atual. */
  cancelHref: string;
  /** A API abriu a outra conta; a tela navega e anuncia. */
  onSwitched: (user: SessionUser) => void;
}

/**
 * Só a senha da conta de destino (REQ-SWITCH-004 a 008). Senha que não confere (ou conta que não dá pra
 * abrir: a API responde igual) esvazia e foca o campo, com a frase neutra no próprio campo, sem dizer se a
 * conta existe. `429` trava o envio com a contagem. A senha fica só no formulário (REQ-SWITCH-010).
 *
 * @example <SwitchPasswordForm target="host" cancelHref="/" onSwitched={(user) => …} />
 */
export function SwitchPasswordForm({ target, cancelHref, onSwitched }: SwitchPasswordFormProps) {
  const mutation = useSwitchAccountMutation();
  const notice = useErrorNotice();
  const { control, handleSubmit, setError, resetField, setFocus, formState } = useForm<SwitchAccountValues>({
    resolver: zodResolver(switchAccountSchema),
    mode: "onTouched",
    defaultValues: { password: "" },
  });
  const account = roleLabel(target);

  function handleApiError(error: unknown) {
    if (isApiError(error) && error.code === "AUTH_LINKED_ACCOUNT_NOT_FOUND") {
      resetField("password");
      setError("password", { type: "server", message: translateError(error) });
      return setFocus("password");
    }
    if (isApiError(error) && error.code === "VALIDATION_ERROR") {
      return applyFieldErrors(setError, error, { fields: ["password"] });
    }
    notice.report(error);
  }

  const onSubmit = handleSubmit(({ password }) => {
    if (mutation.isPending) return;
    notice.clear();
    mutation.mutate({ role: target, password }, { onSuccess: ({ user }) => onSwitched(user), onError: handleApiError });
  });

  return (
    <Stack spacing={3}>
      <ErrorNotice message={notice.message} tone={notice.tone} />
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Controller
              control={control}
              name="password"
              render={({ field: { ref, ...field }, fieldState }) => (
                <PasswordField
                  {...field}
                  inputRef={ref}
                  label={switchCopy.password(account)}
                  autoComplete="current-password"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message ?? switchCopy.passwordHelp(account)}
                  fullWidth
                />
              )}
            />
            <Link component={NextLink} href={forgotPasswordPath(target)} sx={{ alignSelf: "flex-start" }}>
              {switchCopy.forgot}
            </Link>
          </Stack>
          {formState.errors.root?.server && (
            <Typography color="error" role="alert">
              {formState.errors.root.server.message}
            </Typography>
          )}
          <Stack spacing={1.5}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={mutation.isPending || notice.blocked}
              aria-busy={mutation.isPending}
            >
              {mutation.isPending ? switchCopy.submitting : switchCopy.target(account)}
            </Button>
            <Button component={NextLink} href={cancelHref} variant="text" fullWidth>
              {switchCopy.notNow}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
