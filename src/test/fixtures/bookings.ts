/**
 * Fixtures de reservas (specs 050 a 054), no formato de `modulo-bookings.md` e do OpenAPI. Dados sintéticos: nomes,
 * telefone e endereço não são de ninguém.
 */

export const BOOKING_ID = "0199f0a0-0000-7000-8000-0000000000d1";
export const PIPOCA_ID = "0199f0a0-0000-7000-8000-0000000000e1";
export const THOR_ID = "0199f0a0-0000-7000-8000-0000000000e2";

/** Uma reserva como o anfitrião vê. Padrão: pedido esperando resposta, um pet, 5 noites. */
export function bookingDto(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    status: "requested",
    listingId: "0199e0a0-0000-7000-8000-0000000000c1",
    listing: {
      id: "0199e0a0-0000-7000-8000-0000000000c1",
      title: "Casa da Cida",
      neighborhood: "Zona 01",
      city: "Maringá",
      state: "PR",
    },
    ownerId: "0199f0a0-0000-7000-8000-0000000000a1",
    owner: { id: "0199f0a0-0000-7000-8000-0000000000a1", name: "Camila Souza", avatarUrl: null },
    hostId: "0199e0a0-0000-7000-8000-0000000000b1",
    host: { id: "0199e0a0-0000-7000-8000-0000000000b1", name: "Aparecida Souza", avatarUrl: null },
    pets: [{ id: PIPOCA_ID, name: "Pipoca", species: "dog", size: "small" }],
    checkIn: "2026-12-20",
    checkOut: "2026-12-25",
    nights: 5,
    petCount: 1,
    nightlyRate: 60,
    totalPrice: 300,
    requestedAt: "2026-12-10T12:00:00+00:00",
    responseDeadline: "2026-12-11T12:00:00+00:00",
    respondedAt: null,
    confirmedAt: null,
    checkedInAt: null,
    checkedOutAt: null,
    expiredAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    declineReason: null,
    refundPercentage: null,
    contact: null,
    createdAt: "2026-12-10T12:00:00+00:00",
    updatedAt: "2026-12-10T12:00:00+00:00",
    ...overrides,
  };
}

/** Contato do tutor, liberado ao anfitrião depois da confirmação. */
export const ownerContactDto = { phone: "44999990000", address: null };

/** Página de `GET /bookings/me`. */
export function bookingPageDto(items: unknown[] = [bookingDto()], page = 1, pageSize = 20) {
  return { items, page, pageSize, totalCount: items.length, totalPages: 1 };
}
