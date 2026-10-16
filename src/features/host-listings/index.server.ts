import "server-only";

/**
 * API pública server de host-listings (spec 044).
 * Exporte aqui RSC, chamadas ao backend e recursos exclusivos do servidor.
 * Não importe este índice em componentes client.
 */
export { ListingDraftScreen } from "./components/ListingDraftScreen";
export { ListingEditorScreen } from "./components/ListingEditorScreen";
export { MyListingsSummary } from "./components/MyListingsSummary";
export { getHostListingProfile, getMyListings } from "./api/server/listings.server";
