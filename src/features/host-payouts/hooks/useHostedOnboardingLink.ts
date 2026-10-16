"use client";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors/ApiError";
import { createHostedOnboardingLink } from "../api/client/payouts.client";
import { toPayoutAccount } from "../api/mappers";
import { payoutQueries } from "../api/queries";
const navigateToStripe = (url: string) => window.location.assign(url);
/** Navega diretamente para URL efêmera validada; apenas a conta fica no cache. navigate é a borda do navegador para integração/testes. @example const open = useHostedOnboardingLink(user.id); await open(); */
export function useHostedOnboardingLink(accountId: string, navigate: (url: string) => void = navigateToStripe) {
  const client = useQueryClient();
  return useCallback(async () => {
    const link = await createHostedOnboardingLink();
    if (link.expiresAt * 1000 <= Date.now())
      throw new ApiError({ code: "HOST_STRIPE_UNAVAILABLE", status: 503, message: "Expired onboarding link" });
    client.setQueryData(payoutQueries.account(accountId).queryKey, toPayoutAccount(link.account));
    navigate(link.url);
  }, [accountId, client, navigate]);
}
