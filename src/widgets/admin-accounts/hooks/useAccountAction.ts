"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { adminAuditQueryKey } from "@/shared/api/query/queryClient";
import { adminOwnerQueries, type AdminOwner } from "@/features/owners";
import { adminHostQueries, type AdminHost } from "@/features/hosts";
import { suspendOwner, liftOwnerSuspension, releaseOwnerCpf } from "@/features/owners/index.client";
import {
  suspendHost,
  liftHostSuspension,
  releaseHostIdentity,
  resetHostStripeAccount,
} from "@/features/hosts/index.client";
import type { AccountKind } from "../lib/accountRows";
import { accountsCopy } from "../lib/accountsCopy";
/** Ação validada na borda HTTP; retirada de suspensão não recebe motivo na API.
 * @example const action: AccountAction = { action: "resetStripe", reason: "Dados corrigidos" };
 */
export type AccountAction = { action: "lift" } | { action: "suspend" | "release" | "resetStripe"; reason: string };
/** Coordena ações sem retry/otimismo, detalhe atualizado e todas as listas da feature invalidadas.
 * Erros de regra 403/422 relêem detalhe; erros 400 ficam nos campos sem perder a nota.
 * @example const action = useAccountAction(adminId, "hosts", hostId); action.mutate({ action: "resetStripe", reason });
 */
export function useAccountAction(accountId: string, kind: AccountKind, id: string) {
  const client = useQueryClient();
  const keys = kind === "owners" ? adminOwnerQueries : adminHostQueries;
  return useMutation<AdminOwner | AdminHost, Error, AccountAction>({
    mutationKey: [...keys.all(accountId), "action", id],
    mutationFn: (input: AccountAction) => {
      if (kind === "owners") {
        if (input.action === "lift") return liftOwnerSuspension(id);
        if (input.action === "suspend") return suspendOwner(id, { reason: input.reason });
        if (input.action === "release") return releaseOwnerCpf(id, { reason: input.reason });
        throw new Error(accountsCopy.resetUnavailable);
      }
      if (input.action === "lift") return liftHostSuspension(id);
      if (input.action === "suspend") return suspendHost(id, { reason: input.reason });
      if (input.action === "release") return releaseHostIdentity(id, { reason: input.reason });
      return resetHostStripeAccount(id, { reason: input.reason });
    },
    onSuccess: async (data) => {
      client.setQueryData(keys.detail(accountId, id).queryKey, data);
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.lists(accountId) }),
        client.invalidateQueries({ queryKey: keys.detail(accountId, id).queryKey }),
        client.invalidateQueries({
          queryKey: adminAuditQueryKey(accountId, {
            targetType: kind === "owners" ? "owner" : "host",
            targetId: id,
          }),
        }),
      ]);
    },
    onError: async (error) => {
      if (
        [
          "OWNER_SUSPENSION_REQUIRED",
          "HOST_SUSPENSION_REQUIRED",
          "OWNER_CPF_RELEASED",
          "HOST_IDENTITY_RELEASED",
          "AUTH_ADMIN_SUSPENSION_FORBIDDEN",
          "HOST_STRIPE_ACCOUNT_NOT_REJECTED",
        ].some((code) => hasErrorCode(error, code))
      ) {
        await client.invalidateQueries({ queryKey: keys.detail(accountId, id).queryKey });
        await client.invalidateQueries({ queryKey: keys.lists(accountId) });
      }
    },
  });
}
