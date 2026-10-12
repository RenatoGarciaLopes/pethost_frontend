import "server-only";

/**
 * API pública server de auth.
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { LoginScreen } from "./components/LoginScreen";
export type { LoginScreenProps } from "./components/LoginScreen";
