"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerOwner } from "../api/client/registration.client";
import type { OwnerRegistrationValues } from "../schemas/ownerRegistrationSchema";

/**
 * Cadastro de tutor (REQ-OREG-008, 013). No sucesso tira todas as queries do cache (nada de outra conta fica);
 * o cache de mutações fica, porque a tela de sucesso lê o resultado desta mutação.
 * Não navega nem dá `router.refresh()`: a página de cadastro com sessão redireciona (REQ-OREG-015),
 * então a tela de sucesso precisa ficar até a pessoa escolher o próximo passo.
 */
export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    // Só as variáveis: o TanStack Query 5 passa um 2º argumento (contexto) que não é do nosso contrato.
    mutationFn: (values: OwnerRegistrationValues) => registerOwner(values),
    onSuccess: () => queryClient.removeQueries(),
  });
}
