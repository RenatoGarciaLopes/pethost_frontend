import "server-only";

/**
 * API pública server de bookings (specs 050 a 054).
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { HostBookingsScreen } from "./components/HostBookingsScreen";
export { WaitingRequestsSummary } from "./components/WaitingRequestsSummary";
