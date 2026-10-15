import { getMyApplication } from "@/features/host-applications/index.server";
import { HostOnboardingStages } from "./HostOnboardingStages";

/**
 * O painel das três etapas no servidor (REQ-HVER-001): lê a verificação da conta (a mesma busca da tela, por
 * `cache()`) e libera a etapa 2 só com a verificação aprovada. Se a leitura falhar, mostra as etapas como antes da
 * aprovação (nunca libera por engano); a tela ao lado mostra o erro.
 *
 * @example <HostOnboardingPanel accountId={user.id} />
 */
export async function HostOnboardingPanel({ accountId }: { accountId: string }) {
  const mine = await getMyApplication(accountId).catch(() => null);
  return <HostOnboardingStages verificationApproved={mine?.application?.status === "approved"} />;
}
