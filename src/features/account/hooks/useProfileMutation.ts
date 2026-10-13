"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { gatewayFor, type ProfileGateway } from "../api/client/profileGateway";
import type { AccountProfile } from "../types/accountProfile";
/** Composição interna das operações que devolvem perfil, atualizando só a query do usuário. @example useProfileMutation(userId, role, (gateway, patch: AccountProfilePatch) => gateway.save(patch)) */
export function useProfileMutation<T>(
  userId: string,
  role: PersonalRole,
  operation: (gateway: ProfileGateway, values: T) => Promise<AccountProfile>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: T) => operation(gatewayFor(role), values),
    onSuccess: (profile) => {
      queryClient.setQueryData(accountQueryKey(userId, "profile"), profile);
    },
  });
}
