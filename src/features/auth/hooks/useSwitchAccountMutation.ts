"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { switchAccount } from "../api/client/switchAccount.client";

/**
 * Sucesso limpa queries e mutations; navegação e anúncio pertencem à tela (REQ-SWITCH-006).
 * @example const mutation = useSwitchAccountMutation(); mutation.mutate({ role: "host", password });
 */
export function useSwitchAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof switchAccount>[0]) => switchAccount(body),
    onSuccess: () => queryClient.clear(),
  });
}
