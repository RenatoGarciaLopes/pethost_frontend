import type { Pet, PetList } from "../types";
import type { MyPetsDto, PetDto } from "./contracts";

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
  return { active: pets.filter((pet) => pet.isActive), inactive: pets.filter((pet) => !pet.isActive) };
}
