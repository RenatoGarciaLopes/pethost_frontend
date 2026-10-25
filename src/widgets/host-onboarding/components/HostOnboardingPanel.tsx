import { getMyApplication } from "@/features/host-applications/index.server";
import { getHostListingProfile, getMyListings } from "@/features/host-listings/index.server";
import { HostOnboardingStages } from "./HostOnboardingStages";

/**
 * O painel das três etapas no servidor (REQ-HVER-001, REQ-LIST-001), com a situação real: a verificação (030), o
 * recebimento lido do perfil do anfitrião (`stripePayoutsEnabled`/`stripeStatus` de `GET /hosts/me`, sem depender da
 * 043) e se há cantinho aberto. Sem pendências, o widget não renderiza conteúdo. As leituras usam `cache()`, então a tela ao lado não busca de novo. Se alguma falhar, a
 * etapa fica como antes (nunca libera por engano).
 *
 * @example <HostOnboardingPanel accountId={user.id} />
 */
export async function HostOnboardingPanel({ accountId }: { accountId: string }) {
  const [application, profile] = await Promise.all([
    getMyApplication(accountId).catch(() => null),
    getHostListingProfile(accountId).catch(() => null),
  ]);
  const mine = profile?.payoutsEnabled ? await getMyListings(accountId).catch(() => null) : null;
  return (
    <HostOnboardingStages
      progress={{
        verified: profile !== null || application?.application?.status === "approved",
        payouts: profile ? { enabled: profile.payoutsEnabled, status: profile.stripeStatus } : null,
        hasListing: mine?.listings.some((listing) => listing.isActive) ?? false,
      }}
    />
  );
}
