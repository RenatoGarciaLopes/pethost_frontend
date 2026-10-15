"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { synchronizePayoutAccount } from "../api/client/payouts.client";
import { toPayoutAccount } from "../api/mappers";
import { payoutQueries } from "../api/queries";
/** Atualiza o espelho sem inferir aprovação pela saída do Stripe. @example const sync = useSyncPayoutAccount(user.id); await sync.mutateAsync(); */
export function useSyncPayoutAccount(accountId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => toPayoutAccount(await synchronizePayoutAccount()),
    retry: false,
    onSuccess: (account) => {
      client.setQueryData(payoutQueries.account(accountId).queryKey, account);
    },
  });
}
