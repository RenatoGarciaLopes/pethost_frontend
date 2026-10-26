"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import type { RefObject } from "react";
import { Controller, useForm } from "react-hook-form";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { isApiError } from "@/shared/api/errors/ApiError";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { SegmentedControl } from "@/shared/ui/forms/SegmentedControl";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { useRequestPasswordResetMutation } from "../../hooks/usePasswordMutations";
import { passwordCopy } from "../../lib/passwordCopy";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  type ForgotPasswordValues,
} from "../../schemas/forgotPasswordSchema";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";

const { forgot } = passwordCopy;
const ROLE_OPTIONS = (["owner", "host"] as const).map((role) => ({ value: role, label: forgot.roles[role] }));
const FORM_FIELDS = ["email", "role"] as const;

export interface ForgotPasswordFormProps {
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** Conta marcada ao abrir; `admin` esconde a escolha (REQ-PWD-001). */
  initialRole: AccountRole;
  /** Chamado com o `200` da API, que é o mesmo para qualquer e-mail (REQ-PWD-002, 003). */
  onSent: (values: ForgotPasswordValues) => void;
}

/**
 * Pedido do link (REQ-PWD-001, 002, 012): tipo de conta (tutor ou anfitrião) e e-mail. Não existe erro de
 * "conta não encontrada": a API não diz, e a tela não inventa.
 *
 * @example <ForgotPasswordForm headingRef={ref} initialRole="owner" onSent={(values) => …} />
 */
export function ForgotPasswordForm({ headingRef, initialRole, onSent }: ForgotPasswordFormProps) {
  const mutation = useRequestPasswordResetMutation();
  const notice = useErrorNotice();
  const { control, handleSubmit, setError, formState } = useForm<ForgotPasswordInput, unknown, ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { role: initialRole, email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (mutation.isPending) return;
    notice.clear();
    mutation.mutate(values, {
      onSuccess: () => onSent(values),
      onError: (error) =>
        isApiError(error) && error.code === "VALIDATION_ERROR"
          ? applyFieldErrors(setError, error, { fields: FORM_FIELDS })
          : notice.report(error),
    });
  });

  return (
    <Stack spacing={3}>
      <StepHeading ref={headingRef}>{forgot.title}</StepHeading>
      <ErrorNotice message={notice.message} tone={notice.tone} />
      <Box component="form" noValidate onSubmit={onSubmit}>
        <Stack spacing={3}>
          {initialRole !== "admin" && (
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <SegmentedControl
                  label={forgot.roleLabel}
                  options={ROLE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  fullWidth
                />
              )}
            />
          )}
          {formState.errors.role?.message && (
            <Typography color="error" role="alert">
              {formState.errors.role.message}
            </Typography>
          )}
          <Controller
            control={control}
            name="email"
            render={({ field: { ref, ...field }, fieldState }) => (
              <TextField
                {...field}
                inputRef={ref}
                label={forgot.email}
                type="email"
                autoComplete="email"
                required
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          {formState.errors.root?.server && (
            <Typography color="error" role="alert">
              {formState.errors.root.server.message}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={mutation.isPending || notice.blocked}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending ? forgot.submitting : forgot.submit}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
