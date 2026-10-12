"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { AnimatePresence, motion } from "motion/react";
import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { ApiError, isApiError } from "@/shared/api/errors/ApiError";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { MOTION_ASSENTAR } from "@/shared/theme/tokens/springs";
import { DOOR_TARGET_ATTR, DOOR_WARM_ATTR } from "@/shared/ui/brand/DoorScene";
import { Notice } from "@/shared/ui/feedback/Notice";
import { PasswordField } from "@/shared/ui/forms/PasswordField";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { useLoginMutation, useReactivateMutation } from "../../hooks/useLoginMutation";
import { authCopy, type SelectableRole } from "../../lib/authCopy";
import { loginFormSchema, type LoginFormInput, type LoginFormValues } from "../../schemas/loginFormSchema";

export interface LoginFormProps {
  /** `account`: tutor e anfitrião com a escolha do tipo; `admin`: papel fixo, sem cadastro (REQ-AUTH-015). */
  variant: "account" | "admin";
  /** Papel marcado ao abrir (`?as=host` marca anfitrião, REQ-AUTH-001). */
  initialRole: AccountRole;
  /** Destino pedido na URL; validado antes de navegar (REQ-AUTH-005/006). */
  next: string | null;
}

/** Aviso do topo do formulário: qual situação e a frase pronta. */
type FormNotice =
  | { kind: "error"; message: string }
  | { kind: "deactivated"; message: string }
  | { kind: "suspended"; message: string }
  | { kind: "rateLimited"; error: ApiError };

const ROLE_OPTIONS = (["owner", "host"] as const).map((role) => ({ value: role, label: authCopy.roles[role].label }));
const FORM_FIELDS = ["email", "password", "role"] as const;

const isSelectableRole = (role: AccountRole): role is SelectableRole => role === "owner" || role === "host";

/**
 * Formulário de entrar (spec 010). Única ilha client da tela: valida no blur e no envio, chama o BFF,
 * traduz os erros da API em avisos sem culpa e oferece reativar a conta pausada.
 * Marca o `<form>` e o botão para a `DoorScene` reagir (abre no foco, esquenta no hover de "Entrar").
 * Os campos entram um a um logo depois do cartão (ordens 3 a 7 do `Reveal`, REQ-AUTH-020).
 *
 * @example <LoginForm variant="account" initialRole="owner" next={null} />
 */
export function LoginForm({ variant, initialRole, next }: LoginFormProps) {
  const noticeRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const countdown = useCountdown();
  const loginMutation = useLoginMutation(next);
  const reactivateMutation = useReactivateMutation(next);

  const { control, handleSubmit, setError, resetField, formState } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
    defaultValues: { role: initialRole, email: "", password: "" },
  });
  const role = useWatch({ control, name: "role" });

  // O aviso recebe o foco para o leitor de tela anunciar e o teclado continuar dali (REQ-AUTH-007).
  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  function handleApiError(error: unknown, values: LoginFormValues) {
    const message = getErrorMessage(error, isSelectableRole(values.role) ? { role: values.role } : {});
    if (!isApiError(error)) {
      // Falha do próprio front (bug), não da API: aparece no console em desenvolvimento.
      if (process.env.NODE_ENV !== "production") console.error("[login] falha inesperada", error);
      return setNotice({ kind: "error", message });
    }

    switch (error.code) {
      case "VALIDATION_ERROR":
        applyFieldErrors(setError, error, { fields: FORM_FIELDS });
        return setNotice(null);
      case "AUTH_INVALID_CREDENTIALS":
        resetField("password");
        return setNotice({ kind: "error", message });
      case "AUTH_ACCOUNT_DEACTIVATED":
        return setNotice({ kind: "deactivated", message });
      case "AUTH_ACCOUNT_SUSPENDED":
        resetField("password");
        return setNotice({ kind: "suspended", message });
      case "TOO_MANY_REQUESTS":
        countdown.start(error.retryAfterSeconds ?? 30);
        return setNotice({ kind: "rateLimited", error });
      default:
        return setNotice({ kind: "error", message });
    }
  }

  const onSubmit = handleSubmit((values) => {
    setNotice(null);
    loginMutation.mutate(values, { onError: (error) => handleApiError(error, values) });
  });

  function reactivate() {
    // Credenciais do último envio, guardadas só em memória pela mutação (REQ-AUTH-008).
    const values = loginMutation.variables;
    if (!values || !isSelectableRole(values.role)) return;
    reactivateMutation.mutate({ ...values, role: values.role }, { onError: (error) => handleApiError(error, values) });
  }

  // Fim da contagem do limite: o aviso some e o envio volta (REQ-AUTH-010).
  const visibleNotice = notice?.kind === "rateLimited" && !countdown.isRunning ? null : notice;
  const isBusy = loginMutation.isPending || reactivateMutation.isPending || loginMutation.isSuccess;
  const blocked = countdown.isRunning;
  const selectableRole = isSelectableRole(role) ? role : "owner";

  return (
    <Box component="form" noValidate onSubmit={onSubmit} {...{ [DOOR_TARGET_ATTR]: "" }}>
      <Stack spacing={3}>
        <AnimatePresence initial={false}>
          {visibleNotice && (
            <motion.div
              key="notice"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={MOTION_ASSENTAR}
            >
              <Notice
                ref={noticeRef}
                tone={visibleNotice.kind === "deactivated" || visibleNotice.kind === "rateLimited" ? "atencao" : "erro"}
                action={
                  visibleNotice.kind === "deactivated" ? (
                    <Button
                      variant="contained"
                      onClick={reactivate}
                      disabled={reactivateMutation.isPending}
                      aria-busy={reactivateMutation.isPending}
                    >
                      {reactivateMutation.isPending ? authCopy.reactivating : authCopy.reactivate}
                    </Button>
                  ) : undefined
                }
              >
                {visibleNotice.kind === "rateLimited"
                  ? getErrorMessage(
                      new ApiError({ ...visibleNotice.error.toJSON(), retryAfterSeconds: countdown.remaining }),
                    )
                  : visibleNotice.message}
              </Notice>
            </motion.div>
          )}
        </AnimatePresence>

        {variant === "account" && (
          <Reveal order={3}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <SegmentedControl
                  label={authCopy.roleLabel}
                  options={ROLE_OPTIONS}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setNotice(null);
                  }}
                  fullWidth
                />
              )}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} aria-live="polite">
              {authCopy.roles[selectableRole].help}
            </Typography>
          </Reveal>
        )}

        <Reveal order={4}>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={authCopy.email}
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        </Reveal>

        <Reveal order={5}>
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <PasswordField
                {...field}
                label={authCopy.password}
                autoComplete="current-password"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Link
            component={NextLink}
            href={`/forgot-password?as=${variant === "admin" ? "admin" : selectableRole}`}
            sx={{ display: "inline-block", mt: 1 }}
          >
            {authCopy.forgotPassword}
          </Link>
        </Reveal>

        <Reveal order={6}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isBusy || blocked}
            aria-busy={isBusy}
            {...{ [DOOR_WARM_ATTR]: "" }}
          >
            {isBusy ? authCopy.submitting : authCopy.submit}
          </Button>
        </Reveal>

        {blocked && (
          <Typography variant="body2" color="text.secondary" role="timer" aria-live="off">
            {authCopy.countdown(countdown.remaining)}
          </Typography>
        )}

        {variant === "account" && (
          <Reveal order={7}>
            <Typography sx={{ textAlign: "center" }}>
              {authCopy.noAccount}{" "}
              <Link component={NextLink} href={`/register/${selectableRole}`}>
                {authCopy.register}
              </Link>
            </Typography>
          </Reveal>
        )}

        {/* Mantém o RHF ciente de erros de formulário vindos da API sem campo (applyFieldErrors → root). */}
        {formState.errors.root?.server && (
          <Typography color="error" role="alert">
            {formState.errors.root.server.message}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
