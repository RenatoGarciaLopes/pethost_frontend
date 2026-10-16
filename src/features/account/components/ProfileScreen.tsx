import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchAccountProfile } from "../api/server/accountProfile.server";
import { ProfileEditor } from "./client/ProfileEditor";

export interface ProfileScreenProps {
  userId: string;
  role: PersonalRole;
}

/**
 * `/users/profile` no servidor (spec 015): busca o perfil do papel antes de responder e entrega o cache
 * hidratado ao editor, que já abre com os dados (sem esqueleto nem segundo pedido no navegador).
 *
 * @example <ProfileScreen userId={user.id} role="host" />
 */
export async function ProfileScreen({ userId, role }: ProfileScreenProps) {
  const queryClient = getQueryClient();
  await prefetchAccountProfile(queryClient, userId, role);

  return (
    <PageContainer width="page">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProfileEditor userId={userId} role={role} />
      </HydrationBoundary>
    </PageContainer>
  );
}
