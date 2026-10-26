import "server-only";

/**
 * API pública server de bookings (specs 050 a 054).
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { HostBookingDetailScreen } from "./components/HostBookingDetailScreen";
export { HostBookingsScreen } from "./components/HostBookingsScreen";
export { OwnerStayDetailScreen } from "./components/OwnerStayDetailScreen";
export { BookingPaymentScreen } from "./components/BookingPaymentScreen";
export { OwnerStaysScreen } from "./components/OwnerStaysScreen";
export { getBookingDetail } from "./api/server/bookings.server";
export { RequestStayHostNotice } from "./components/RequestStayHostNotice";
export { WaitingRequestsSummary } from "./components/WaitingRequestsSummary";
