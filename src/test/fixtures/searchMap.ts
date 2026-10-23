import type { SearchMapListing, SearchMapOrigin } from "@/features/search/components/client/SearchMap";

/** Origem sintética da busca, na Zona 7 de Maringá. @example <SearchMap origin={searchMapOrigin} … /> */
export const searchMapOrigin: SearchMapOrigin = { latitude: -23.4205, longitude: -51.9331, label: "Zona 7" };

/** Cantinho sintético com círculo aproximado de 500 m (nunca coordenada exata). @example searchMapListingFixture({ title: "Casa da Teresa" }) */
export function searchMapListingFixture(overrides: Partial<SearchMapListing> = {}): SearchMapListing {
  return {
    id: "0199d2a0-0000-7000-8000-000000000051",
    title: "Casa da Dona Cida",
    neighborhood: "Jd. Alvorada",
    nightlyRate: 60,
    coverPhotoUrl: null,
    distanceKm: 2.1,
    rating: { average: 4.9, count: 18 },
    approximateLocation: { latitude: -23.4075, longitude: -51.9275, radiusMeters: 500 },
    ...overrides,
  };
}

/** Cinco cantinhos em volta da origem, como no board `Busca-Mapa`. @example <SearchMap listings={searchMapListingsFixture} … /> */
export const searchMapListingsFixture: SearchMapListing[] = [
  searchMapListingFixture(),
  searchMapListingFixture({
    id: "0199d2a0-0000-7000-8000-000000000052",
    title: "Casa do Seu Antônio",
    neighborhood: "Zona 7",
    nightlyRate: 55,
    distanceKm: 0.6,
    rating: { average: 4.8, count: 9 },
    approximateLocation: { latitude: -23.4172, longitude: -51.9302, radiusMeters: 500 },
  }),
  searchMapListingFixture({
    id: "0199d2a0-0000-7000-8000-000000000053",
    title: "Apê da Juliana",
    neighborhood: "Zona 5",
    nightlyRate: 70,
    distanceKm: 1.4,
    rating: { average: 5, count: 4 },
    approximateLocation: { latitude: -23.4168, longitude: -51.9468, radiusMeters: 500 },
  }),
  searchMapListingFixture({
    id: "0199d2a0-0000-7000-8000-000000000054",
    title: "Casa da Teresa",
    neighborhood: "Zona 2",
    nightlyRate: 65,
    distanceKm: 2.8,
    rating: { average: 4.7, count: 23 },
    approximateLocation: { latitude: -23.4352, longitude: -51.9372, radiusMeters: 500 },
  }),
  searchMapListingFixture({
    id: "0199d2a0-0000-7000-8000-000000000055",
    title: "Casa da Bruna e do Diego",
    neighborhood: "Vila Morangueira",
    nightlyRate: 58,
    distanceKm: 4.5,
    rating: null,
    approximateLocation: { latitude: -23.4268, longitude: -51.9158, radiusMeters: 500 },
  }),
];
