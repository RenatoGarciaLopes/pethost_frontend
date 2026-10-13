"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutBestEffort } from "@/shared/auth/client/logoutBestEffort";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { gatewayFor } from "../api/client/profileGateway";
/** Pausa só o papel atual; após sucesso tenta logout e limpa cache. Não navega. @example useDeactivateMutation("owner").mutate(); */
export function useDeactivateMutation(role: PersonalRole) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gatewayFor(role).deactivate(),
    onSuccess: async () => {
      await logoutBestEffort();
      queryClient.clear();
    },
  });
}
