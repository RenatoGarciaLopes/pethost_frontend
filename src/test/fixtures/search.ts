import type { ListingSummary, SearchPet, SearchQuery } from "@/features/search";

/** Resumo público sintético, sem endereço privado. @example listingFixture({ title: "Casa com jardim" }) */
export function listingFixture(overrides: Partial<ListingSummary> = {}): ListingSummary {
  return {
    id: "0199d2a0-0000-7000-8000-000000000041",
    hostId: "0199d2a0-0000-7000-8000-000000000042",
    host: {
      id: "0199d2a0-0000-7000-8000-000000000042",
      name: "Casa Cida",
      avatarUrl: null,
      isCompany: true,
      isAvailable: true,
      payoutsEnabled: true,
    },
    title: "Quintal da Cida",
    city: "Maringá",
    neighborhood: "Zona 7",
    state: "PR",
    nightlyRate: 60.1,
    capacity: 5,
    homeType: "house",
    hasYard: true,
    acceptedSpecies: ["dog", "cat"],
    acceptsSmall: true,
    acceptsMedium: true,
    acceptsLarge: true,
    availableWeekdays: ["monday"],
    coverPhotoUrl: null,
    distanceKm: 1.4,
    badges: ["neighbor", "yard", "fast_responder", "experienced"],
    ...overrides,
  };
}
/** Estado mínimo da URL. @example searchQueryFixture({ where: "Curitiba" }) */
export function searchQueryFixture(overrides: Partial<SearchQuery> = {}): SearchQuery {
  return { pets: [], species: [], sizes: [], weekdays: [], ...overrides };
}
/** Pets ativos sintéticos para formulário e derivação. @example <SearchBar pets={searchPetsFixture} {...props} /> */
export const searchPetsFixture: SearchPet[] = [
  { id: "0199d2a0-0000-7000-8000-0000000000e1", name: "Luna", species: "dog", size: "medium" },
  { id: "0199d2a0-0000-7000-8000-0000000000e2", name: "Thor", species: "cat", size: null },
];
