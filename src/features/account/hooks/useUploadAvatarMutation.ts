"use client";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { useProfileMutation } from "./useProfileMutation";
/** Foto por PUT direto e confirmacao; quem escolhe o arquivo deve validar antes. Atualiza cache com o perfil recebido. @example useUploadAvatarMutation(user.id, "owner").mutate(file); */
export function useUploadAvatarMutation(userId: string, role: PersonalRole) {
  return useProfileMutation<File>(userId, role, (gateway, file) => gateway.uploadAvatar(file));
}
