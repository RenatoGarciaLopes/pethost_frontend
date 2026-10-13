"use client";
import { useQuery } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { gatewayFor } from "../api/client/profileGateway";
import { ACCOUNT_PROFILE_STALE_TIME } from "../api/contracts/profile";
/** Perfil por id autenticado, fresco por 60 s e com refetch após falha. @example const profile = useAccountProfile(user.id, "host"); */
export function useAccountProfile(userId: string, role: PersonalRole) {
  return useQuery({
    queryKey: accountQueryKey(userId, "profile"),
    queryFn: () => gatewayFor(role).load(),
    staleTime: ACCOUNT_PROFILE_STALE_TIME,
  });
}
