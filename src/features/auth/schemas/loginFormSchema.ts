import { z } from "zod";
import { accountRoleSchema } from "@/shared/auth/contracts/session";
import { authCopy } from "../lib/authCopy";

/** Limite de tamanho da senha no login (protege o servidor; não revela a política de senha forte). */
export const LOGIN_PASSWORD_MAX = 128;

/**
 * Formulário de entrar (spec 010, REQ-AUTH-003). E-mail é normalizado (sem espaços, minúsculo);
 * a senha só é exigida, **sem** regra de força, para o login não vazar a política.
 */
export const loginFormSchema = z.object({
  role: accountRoleSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, authCopy.fieldErrors.emailMissing)
    .email(authCopy.fieldErrors.emailInvalid),
  password: z
    .string()
    .min(1, authCopy.fieldErrors.passwordMissing)
    .max(LOGIN_PASSWORD_MAX, authCopy.fieldErrors.passwordTooLong),
});

/** Valores digitados (antes da normalização). */
export type LoginFormInput = z.input<typeof loginFormSchema>;
/** Valores prontos para enviar. */
export type LoginFormValues = z.output<typeof loginFormSchema>;
