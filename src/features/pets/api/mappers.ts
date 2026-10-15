import type { HouseResident, Pet, PetList } from "../types";
import type { HostPetsResponse, MyPetsDto, PetDto } from "./contracts";
import { PostApiV1PetsBody } from "@/shared/api/generated/pets/pets.zod";
import { petProfileSchema, type PetProfileValues } from "../schemas/petProfileSchema";

/**
 * DTO → pet da carteirinha: só o que a tela usa, com a primeira foto como capa.
 * @example toPet(dto).coverUrl // "https://…/thor.jpg" ou null
 */
export function toPet(dto: PetDto): Pet {
  return {
    id: dto.id,
    name: dto.name,
    species: dto.species,
    speciesDescription: dto.speciesDescription ?? null,
    breed: dto.breed ?? null,
    size: dto.size ?? null,
    birthDate: dto.birthDate ?? null,
    sex: dto.sex,
    isNeutered: dto.isNeutered,
    coverUrl: dto.photos[0]?.url ?? null,
    isActive: dto.isActive,
  };
}

/**
 * `GET /pets/me` → ativos e inativos, na ordem da API (REQ-PETS-001, 005).
 * @example toPetList(dto).inactive.length // pets "Fora da lista"
 */
export function toPetList(dto: MyPetsDto): PetList {
  const pets = dto.pets.map(toPet);
  return {
    ...(dto.keeper?.type === "host" ? { hostId: dto.keeper.id } : {}),
    active: pets.filter((pet) => pet.isActive),
    inactive: pets.filter((pet) => !pet.isActive),
  };
}

/** Projeção explícita da vitrine: campos privados nunca chegam ao cache público. @example toHouseResidents(dto) */
export function toHouseResidents(dto: HostPetsResponse): HouseResident[] {
  return dto.pets
    .filter((pet) => pet.isActive)
    .map((pet) => ({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      speciesDescription: pet.species === "exotic" ? (pet.speciesDescription ?? null) : null,
      size: pet.species === "dog" || pet.species === "cat" ? (pet.size ?? null) : null,
      coverUrl: pet.photos[0]?.url ?? null,
      goodWithDogs: pet.goodWithDogs,
      goodWithCats: pet.goodWithCats,
      goodWithKids: pet.goodWithKids,
    }));
}

/** Corpo validado na ficha e no contrato gerado; valores ausentes não são enviados. @example toCreatePetRequest(values) */
export function toCreatePetRequest(values: PetProfileValues) {
  const parsed = PostApiV1PetsBody.parse(petProfileSchema.parse(values));
  return PostApiV1PetsBody.parse(Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined)));
}
