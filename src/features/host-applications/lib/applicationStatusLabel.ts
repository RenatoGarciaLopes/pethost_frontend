import type { ApplicationStatus } from "../types";

/**
 * Nome curto de cada status, para o selo da tela (`StatusPill`). Exportado para o admin (031).
 * @example <StatusPill label={applicationStatusLabel[application.status]} />
 */
export const applicationStatusLabel: Readonly<Record<ApplicationStatus, string>> = {
  draft: "Pela metade",
  submitted: "Em análise",
  approved: "Aprovada",
  rejected: "Recusada",
  rejected_final: "Encerrada",
  cancelled: "Desistência",
  expired: "Vencida",
};
