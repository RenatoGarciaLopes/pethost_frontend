"use client";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import type { AccountProfilePatch } from "../types/accountProfile";
import { useProfileMutation } from "./useProfileMutation";
/** PATCH do papel atual; sucesso substitui perfil no cache, sem navegar. @example useSaveProfileMutation(user.id, "owner").mutate({ phone: "11999999999" }); */
export function useSaveProfileMutation(userId: string, role: PersonalRole) {
  return useProfileMutation<AccountProfilePatch>(userId, role, (gateway, patch) => gateway.save(patch));
}
