import "server-only";

/**
 * API pública server de host-applications.
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { ApplicationStatusScreen } from "./components/ApplicationStatusScreen";
export { ApplicationWizardScreen } from "./components/ApplicationWizardScreen";
export { getMyApplication } from "./api/server/myApplication.server";
