/** Contratos e utilitários neutros para composição da página de cantinho. */
export { ListingPageScreen } from "./components/ListingPageScreen";
export type { ListingPageScreenProps, ListingPageStay } from "./components/ListingPageScreen";
export { listingDetailSchema } from "./api/contracts";
export type { ListingDetail } from "./api/contracts";
export { petFitsListing } from "./lib/petFitsListing";
export type { ListingFitPet, ListingFitResult, ListingFitRules } from "./lib/petFitsListing";
export { stayTotal } from "./lib/stayTotal";
export { compatibilityReasons } from "./lib/listingFacts";
