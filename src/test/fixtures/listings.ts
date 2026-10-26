/**
 * Fixtures do cantinho (spec 044), no formato de `modulo-listings.md` seção 3.2 e de `GET /hosts/me`. Dados
 * sintéticos: nada aqui é endereço ou pessoa real.
 */

/** Endereço do cantinho como a API manda ao dono. */
export const listingAddressDto = {
  zipCode: "87020000",
  street: "Avenida Brasil",
  number: "120",
  complement: null,
  neighborhood: "Zona 01",
  city: "Maringá",
  state: "PR",
};

/** Um cantinho completo, como o dono vê (`GET /listings/{id}`). Padrão: ativo, de pessoa física, sem fotos. */
export function listingDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "0199e0a0-0000-7000-8000-0000000000c1",
    hostId: "0199e0a0-0000-7000-8000-0000000000b1",
    title: "Casa da Cida",
    description: "Casa térrea com quintal gramado e sombra de manhã.",
    homeType: "house",
    hasYard: true,
    hasDogs: true,
    hasCats: false,
    hasKids: false,
    acceptedSpecies: ["dog", "cat"],
    acceptsSmall: true,
    acceptsMedium: true,
    acceptsLarge: false,
    capacity: 3,
    nightlyRate: 60,
    houseRules: "Sem sofá.",
    availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    address: listingAddressDto,
    location: { latitude: -23.42, longitude: -51.93 },
    approximateLocation: { latitude: -23.42, longitude: -51.93, radiusMeters: 500 },
    photos: [],
    isActive: true,
    deactivatedAt: null,
    createdAt: "2026-10-14T12:00:00+00:00",
    updatedAt: "2026-10-14T12:00:00+00:00",
    ...overrides,
  };
}

/** `GET /listings/me`: o anfitrião uma vez e os cantinhos. */
export function myListingsDto(listings: unknown[] = [], host: Record<string, unknown> = {}) {
  return {
    host: {
      id: "0199e0a0-0000-7000-8000-0000000000b1",
      name: "Cida Souza",
      avatarUrl: null,
      isCompany: false,
      isAvailable: true,
      payoutsEnabled: true,
      ...host,
    },
    listings,
  };
}

/** `GET /hosts/me` de um anfitrião verificado, pessoa física, com o recebimento liberado. */
export function hostMeDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "0199e0a0-0000-7000-8000-0000000000b1",
    userId: "0199e0a0-0000-7000-8000-0000000000a1",
    personType: "pf",
    cpf: "52998224725",
    company: null,
    verifiedAt: "2026-10-10T12:00:00+00:00",
    isActive: true,
    suspendedAt: null,
    identityReleasedAt: null,
    stripeConnected: true,
    stripePayoutsEnabled: true,
    stripeStatus: "enabled",
    createdAt: "2026-10-10T12:00:00+00:00",
    user: {
      id: "0199e0a0-0000-7000-8000-0000000000a1",
      fullName: "Aparecida Souza",
      email: "cida@pethost.test",
      role: "host",
      phone: null,
      avatarUrl: null,
      birthDate: "1968-04-02",
      address: { ...listingAddressDto, complement: "Casa 2" },
      isActive: true,
      createdAt: "2026-10-01T12:00:00+00:00",
    },
    ...overrides,
  };
}
