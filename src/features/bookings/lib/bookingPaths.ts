/** "Pedidos e estadias" do anfitrião. */
export const HOST_BOOKINGS_PATH = "/host/bookings";

/**
 * Lista do anfitrião numa aba (e página, a partir da 2).
 * @example hostBookingsPath("proximas") // "/host/bookings?aba=proximas"
 */
export function hostBookingsPath(tab: string, page = 1): string {
  return page > 1 ? `${HOST_BOOKINGS_PATH}?aba=${tab}&pagina=${page}` : `${HOST_BOOKINGS_PATH}?aba=${tab}`;
}

/**
 * Detalhe de um pedido do anfitrião.
 * @example hostBookingPath(booking.id)
 */
export const hostBookingPath = (bookingId: string) => `${HOST_BOOKINGS_PATH}/${encodeURIComponent(bookingId)}`;

/** "Minhas estadias" do tutor. */
export const OWNER_BOOKINGS_PATH = "/owner/bookings";

/**
 * Lista do tutor numa aba.
 * @example ownerBookingsPath("anteriores") // "/owner/bookings?aba=anteriores"
 */
export const ownerBookingsPath = (tab: string) => `${OWNER_BOOKINGS_PATH}?aba=${tab}`;

/**
 * Detalhe de uma estadia do tutor.
 * @example ownerBookingPath(booking.id)
 */
export const ownerBookingPath = (bookingId: string) => `${OWNER_BOOKINGS_PATH}/${encodeURIComponent(bookingId)}`;

/** A busca de cantinhos (spec 041). */
export const SEARCH_PATH = "/search";
