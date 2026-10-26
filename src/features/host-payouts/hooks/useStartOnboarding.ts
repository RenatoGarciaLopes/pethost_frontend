"use client";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createOnboardingSession } from "../api/client/payouts.client";
import { toPayoutAccount } from "../api/mappers";
import { payoutQueries } from "../api/queries";
/** Callback imperativo: evita guardar clientSecret no MutationCache. Só account vai ao cache. @example const createSession = useStartOnboarding(user.id); await createSession(); */
export function useStartOnboarding(accountId: string) {
  const client = useQueryClient();
  return useCallback(async () => {
    const session = await createOnboardingSession();
    client.setQueryData(payoutQueries.account(accountId).queryKey, toPayoutAccount(session.account));
    return session;
  }, [accountId, client]);
}
