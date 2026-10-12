"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { SessionResult } from "@/shared/auth/contracts/session";
import { resolvePostLoginPath } from "@/shared/config/appRoutes";

/**
 * Mutação que abre uma sessão (login ou reativação) e termina igual nos dois casos (REQ-AUTH-004/005):
 * limpa todo o cache (nada da conta anterior), vai para o `next` seguro ou para a casa do papel e
 * atualiza os Server Components (que agora leem o cookie novo).
 *
 * @param request chamada ao BFF que devolve `{ user }`
 * @param next destino pedido na URL; validado por `resolvePostLoginPath`
 */
export function useSessionStartMutation<TVariables>(
  request: (variables: TVariables) => Promise<SessionResult>,
  next: string | null | undefined,
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    // Só as variáveis: o TanStack Query 5 passa um 2º argumento (contexto) que não é do nosso contrato.
    mutationFn: (variables: TVariables) => request(variables),
    onSuccess: ({ user }) => {
      queryClient.clear();
      router.replace(resolvePostLoginPath(user.role, next));
      router.refresh();
    },
  });
}
