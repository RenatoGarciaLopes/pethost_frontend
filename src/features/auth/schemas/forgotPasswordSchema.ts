import { z } from "zod";
import { accountRoleSchema } from "@/shared/auth/contracts/session";
import { loginFormSchema } from "./loginFormSchema";

/**
 * Pedido de recuperação: mesma normalização e mensagens do e-mail de login (REQ-PWD-001/002).
 * @example forgotPasswordSchema.parse({ role: "owner", email: " Pessoa@exemplo.test " })
 */
export const forgotPasswordSchema = z.object({ role: accountRoleSchema, email: loginFormSchema.shape.email });

/** Valores digitados antes da normalização. */
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
/** Valores normalizados para o BFF. */
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>;
