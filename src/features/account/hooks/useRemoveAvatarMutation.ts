"use client";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { useProfileMutation } from "./useProfileMutation";
/** DELETE idempotente da foto; atualiza cache sem navegar. @example useRemoveAvatarMutation(user.id, "host").mutate(); */
export function useRemoveAvatarMutation(userId: string, role: PersonalRole) {
  return useProfileMutation<void>(userId, role, (gateway) => gateway.removeAvatar());
}
