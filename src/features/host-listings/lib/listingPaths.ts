/** Painel do anfitrião. */
export const HOST_HOME_PATH = "/host";
/** Cadastro do cantinho. */
export const NEW_LISTING_PATH = "/host/listings/new";
/** "Como eu recebo" (spec 043). */
export const PAYMENTS_PATH = "/host/payments";
/** Âncora da seção de fotos na página do cantinho. */
export const PHOTOS_ANCHOR = "secao-photos";

/**
 * Página do cantinho do dono.
 * @example listingPath(listing.id) // "/host/listings/<id>"
 */
export const listingPath = (listingId: string) => `/host/listings/${encodeURIComponent(listingId)}`;
