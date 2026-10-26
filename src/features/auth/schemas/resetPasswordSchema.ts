import { z } from "zod";
import { isStrongPassword, PASSWORD_MAX } from "@/shared/lib/validation/password";
import { authCopy } from "../lib/authCopy";

/**
 * Senha nova sem normalização, com as cinco regras compartilhadas da API (REQ-PWD-007).
 * @example resetPasswordSchema.parse({ newPassword: "Abcdef1!" })
 */
export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .max(PASSWORD_MAX, authCopy.fieldErrors.passwordTooLong)
    .refine(isStrongPassword, authCopy.fieldErrors.passwordWeak),
});

/** Senha digitada. */
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
/** Senha validada, sem token na estrutura do formulário. */
export type ResetPasswordValues = z.output<typeof resetPasswordSchema>;
