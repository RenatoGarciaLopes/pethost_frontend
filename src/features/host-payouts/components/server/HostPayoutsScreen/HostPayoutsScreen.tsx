import { Stack } from "@mui/material";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { PageHeader } from "@/shared/ui/layout/PageHeader";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchPayoutAccount } from "../../../api/server/payoutAccount.server";
import { payoutsCopy } from "../../../lib/payoutsCopy";
import { HostPayouts } from "../../client/HostPayouts";
/** Conta autenticada pelo requireRole da página; não chamar com id vindo de query string. @example <HostPayoutsScreen accountId={user.id} /> */
export interface HostPayoutsScreenProps {
  accountId: string;
}
/** Casca RSC com prefetch/hidratação sem segredos Stripe. Requer papel host confirmado antes da composição. @example <HostPayoutsScreen accountId={user.id} /> */
export async function HostPayoutsScreen({ accountId }: HostPayoutsScreenProps) {
  const client = getQueryClient();
  await prefetchPayoutAccount(client, accountId);
  return (
    <PageContainer width="page">
      <Stack spacing={3}>
        <PageHeader title={payoutsCopy.title} />
        <HydrationBoundary state={dehydrate(client)}>
          <HostPayouts key={accountId} accountId={accountId} />
        </HydrationBoundary>
      </Stack>
    </PageContainer>
  );
}
