"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerAccount, type RegisterPath } from "../api/client/registration.client";
import type { RegisterBody } from "../api/contracts/registerBodies";

/**
 * Cadastro de pessoa na rota da variante (REQ-OREG-008, 013; REQ-HREG-004, 007). No sucesso tira todas as
 * queries do cache (nada de outra conta fica); o cache de mutações fica, porque a tela de sucesso lê o
 * resultado desta mutação.
 * Não navega nem dá `router.refresh()`: a página de cadastro com sessão redireciona (REQ-OREG-015),
 * então a tela de sucesso precisa ficar até a pessoa escolher o próximo passo.
 *
 * @example const mutation = useRegisterMutation("/users/register"); mutation.mutate(body)
 */
export function useRegisterMutation(path: RegisterPath) {
  const queryClient = useQueryClient();
  return useMutation({
    // Só as variáveis: o TanStack Query 5 passa um 2º argumento (contexto) que não é do nosso contrato.
    mutationFn: (body: RegisterBody) => registerAccount(path, body),
    onSuccess: () => queryClient.removeQueries(),
  });
}
