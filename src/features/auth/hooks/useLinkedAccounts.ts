"use client";

import { useQuery } from "@tanstack/react-query";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { getLinkedAccounts } from "../api/client/linkedAccounts.client";
import { LINKED_ACCOUNTS_STALE_TIME } from "../api/contracts/linkedAccounts";

/**
 * Consulta contas da sessão com cache por usuário e frescor de 60 segundos (REQ-SWITCH-003).
 * `enabled: false` para de buscar (a tela que está saindo depois da troca não relê a lista).
 * @example const accounts = useLinkedAccounts(user.id);
 */
export function useLinkedAccounts(userId: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: accountQueryKey(userId, "linked-accounts"),
    queryFn: () => getLinkedAccounts(),
    staleTime: LINKED_ACCOUNTS_STALE_TIME,
  });
}
