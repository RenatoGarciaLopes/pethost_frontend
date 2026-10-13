import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchLinkedAccounts } from "../api/server/linkedAccounts.server";
import { AccountSwitchPanel } from "./client/AccountSwitchPanel";
import { PasswordScreen } from "./PasswordScreen";

export interface AccountSwitchScreenProps {
  userId: string;
  current: PersonalRole;
  target: PersonalRole;
}

/**
 * `/users/switch` no servidor (spec 014): busca as contas vinculadas antes de responder e entrega o cache
 * hidratado ao painel, que já abre no estado certo, sem loader nem segundo pedido no navegador.
 *
 * @example <AccountSwitchScreen userId={user.id} current="owner" target="host" />
 */
export async function AccountSwitchScreen({ userId, current, target }: AccountSwitchScreenProps) {
  const queryClient = getQueryClient();
  await prefetchLinkedAccounts(queryClient, userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PasswordScreen>
        <AccountSwitchPanel userId={userId} current={current} target={target} />
      </PasswordScreen>
    </HydrationBoundary>
  );
}
