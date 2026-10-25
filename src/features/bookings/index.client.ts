/**
 * API pública client de bookings (specs 050 a 054).
 * Reexporte aqui componentes client e hooks para ilhas interativas.
 * A diretiva use client pertence à implementação, não a este índice.
 * Não exporte recursos server-only.
 */
export { RequestStayForm } from "./components/client/RequestStayForm";
export type { RequestStayFormProps, RequestStayListing } from "./components/client/RequestStayForm";
export type { PickablePet } from "./components/client/PetPickCards";
export { useStayUpdates } from "./hooks/useStayUpdates";
export { bookingQueries } from "./api/queries";
