import type { PetDto } from "./contracts";
import type { PetProfileValues } from "../schemas/petProfileSchema";
import type { PetDetail } from "../types";
import { allowsSize, requiresDescription } from "../lib/species";

/** Converte DTO sem revalidar regras de edição: null vira ausente. @example toPetProfileValues(dto) */
export function toPetProfileValues(dto: PetDto): PetProfileValues {
  const { species, name, sex, isNeutered, isVaccinated, goodWithDogs, goodWithCats, goodWithKids } = dto;
  const values: PetProfileValues = {
    species,
    name,
    sex,
    isNeutered,
    isVaccinated,
    goodWithDogs,
    goodWithCats,
    goodWithKids,
  };
  for (const key of [
    "breed",
    "birthDate",
    "medicationNotes",
    "feedingNotes",
    "vetContact",
    "notes",
    "microchip",
    "allergies",
  ] as const) {
    const value = dto[key];
    if (value != null) values[key] = value;
  }
  if (dto.weightKg != null) values.weightKg = dto.weightKg;
  if (allowsSize(species) && dto.size != null) values.size = dto.size;
  if (requiresDescription(species) && dto.speciesDescription != null)
    values.speciesDescription = dto.speciesDescription;
  return values;
}
/** Modelo da ficha com fotos na ordem da API. @example toPetDetail(dto) */
export function toPetDetail(dto: PetDto): PetDetail {
  return { id: dto.id, isActive: dto.isActive, values: toPetProfileValues(dto), photos: dto.photos };
}
