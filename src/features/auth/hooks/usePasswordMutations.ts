"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffClient } from "@/shared/api/client/bffClient";
import { emptyDataSchema } from "@/shared/api/contracts/emptyData";
import { requestPasswordReset, resetPassword } from "../api/client/password.client";

/**
 * Solicita o link sem alterar a sessão atual (REQ-PWD-002).
 * @example const mutation = useRequestPasswordResetMutation(); mutation.mutate({ email: "pessoa@exemplo.test", role: "host" });
 */
export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (values: Parameters<typeof requestPasswordReset>[0]) => requestPasswordReset(values),
  });
}

/**
 * Troca a senha e encerra a sessão local em melhor esforço antes de limpar todo o cache (REQ-PWD-011).
 * @example const mutation = useResetPasswordMutation(); mutation.mutate({ token: "token-do-link", newPassword: "Abcdef1!" });
 */
export function useResetPasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof resetPassword>[0]) => resetPassword(body),
    onSuccess: async () => {
      await bffClient
        .request({ method: "POST", path: "/auth/sessions/logout" }, emptyDataSchema)
        .catch(() => undefined);
      queryClient.clear();
    },
  });
}
