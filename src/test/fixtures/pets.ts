/** Fixtures de pets no formato da API (spec 020): `GET /pets/me` manda o dono uma vez e cada pet sem ele. */

export const petKeeperDto = {
  id: "0199d2a0-0000-7000-8000-0000000000aa",
  type: "owner",
  name: "Camila Souza",
  avatarUrl: null,
};

/** Ficha mínima concluída do assistente, sem fotos ou identificadores sensíveis (REQ-PNEW-023). */
export const petProfileValuesFixture = {
  species: "dog",
  name: "Mel",
  sex: "female",
  size: "small",
  isVaccinated: true,
  isNeutered: false,
  goodWithDogs: true,
  goodWithCats: false,
  goodWithKids: true,
} as const;

/** Pet como a API manda em `GET /pets/me` (sem ownerId, hostId e keeper). */
export function petDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "0199d2a0-0000-7000-8000-000000000001",
    species: "dog",
    speciesDescription: null,
    name: "Thor",
    breed: "Vira-lata",
    size: "medium",
    birthDate: "2022-03-10",
    sex: "male",
    isNeutered: true,
    isVaccinated: true,
    medicationNotes: null,
    feedingNotes: null,
    goodWithDogs: true,
    goodWithCats: false,
    goodWithKids: true,
    vetContact: null,
    notes: null,
    weightKg: 12.5,
    microchip: null,
    allergies: null,
    photos: [{ id: "0199d2a0-0000-7000-8000-0000000000f1", url: "https://cdn.pethost.test/thor.jpg" }],
    isActive: true,
    deactivatedAt: null,
    createdAt: "2026-10-01T12:00:00Z",
    updatedAt: "2026-10-01T12:00:00Z",
    ...overrides,
  };
}
