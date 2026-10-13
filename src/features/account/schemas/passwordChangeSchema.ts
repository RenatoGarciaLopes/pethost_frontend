import { z } from "zod";
import { isStrongPassword, PASSWORD_MAX } from "@/shared/lib/validation/password";
/**
 * Senha atual apenas exigida (mesmos limites do login); nova senha cumpre as cinco regras.
 * Nenhuma senha recebe trim nem normalização.
 * @example passwordChangeSchema.parse({ currentPassword: "antiga", newPassword: "Abcdef1!" })
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Falta a senha.").max(PASSWORD_MAX, "A senha passou de 128 caracteres."),
  newPassword: z
    .string()
    .max(PASSWORD_MAX, "A senha passou de 128 caracteres.")
    .refine(isStrongPassword, "A senha ainda não cumpre a régua."),
});
export type PasswordChangeValues = z.output<typeof passwordChangeSchema>;
