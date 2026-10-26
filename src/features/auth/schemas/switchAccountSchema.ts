import { z } from "zod";
import { loginFormSchema } from "./loginFormSchema";

/**
 * Senha da conta de destino (REQ-SWITCH-004): a mesma regra do login, só exigida e sem regra de força,
 * para não vazar a política. O papel de destino não é campo: vem da página.
 * @example switchAccountSchema.parse({ password: "Senha#forte1" })
 */
export const switchAccountSchema = z.object({ password: loginFormSchema.shape.password });

export type SwitchAccountValues = z.infer<typeof switchAccountSchema>;
