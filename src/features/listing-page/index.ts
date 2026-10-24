/** Contratos e utilitários neutros para composição da página de cantinho. */
export { listingDetailSchema } from "./api/contracts";
export type { ListingDetail } from "./api/contracts";
export { petFitsListing } from "./lib/petFitsListing";
export type { ListingFitPet, ListingFitResult, ListingFitRules } from "./lib/petFitsListing";
export { stayTotal } from "./lib/stayTotal";
export { listingClosedDays } from "./lib/listingClosedDays";
export type { ListingClosedPeriod } from "./lib/listingClosedDays";
export { compatibilityReasons } from "./lib/listingFacts";
