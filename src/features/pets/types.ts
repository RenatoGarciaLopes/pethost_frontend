import type { z } from "zod";
import type { petSexSchema, petSizeSchema, petSpeciesSchema } from "./api/contracts";
import type { PetProfileValues } from "./schemas/petProfileSchema";

export type PetSpecies = z.output<typeof petSpeciesSchema>;
export type PetSize = z.output<typeof petSizeSchema>;
export type PetSex = z.output<typeof petSexSchema>;

/** O pet como a carteirinha usa (spec 020). A ficha (022) amplia com o que ela mostrar. */
export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  /** Só em `exotic`: o que é o animal ("Iguana verde"). */
  speciesDescription: string | null;
  breed: string | null;
  size: PetSize | null;
  /** `yyyy-MM-dd`, aproximada. */
  birthDate: string | null;
  sex: PetSex;
  isNeutered: boolean;
  /** A primeira foto é a capa. */
  coverUrl: string | null;
  isActive: boolean;
}

/** "Meus pets": ativos na grade; inativos em "Fora da lista" (REQ-PETS-005). Ordem da API. */
export interface PetList {
  /** Id do perfil, obtido do keeper da API; não é o id da conta. */
  hostId?: string;
  active: Pet[];
  inactive: Pet[];
}

/** Dados permitidos na vitrine, sem saúde nem identificadores privados. @example const residents: HouseResident[] = []; */
export interface HouseResident {
  id: string;
  name: string;
  species: PetSpecies;
  speciesDescription: string | null;
  size: PetSize | null;
  coverUrl: string | null;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  goodWithKids: boolean;
}

/** Uma foto da ficha (spec 022): o id serve para trocar (`PATCH`) e tirar (`DELETE`). */
export interface PetPhoto {
  id: string;
  url: string;
}

/**
 * A ficha inteira (spec 022), como `petQueries.detail` guarda: os valores no mesmo formato do formulário da
 * 021 (o que a API manda `null` vira ausente) e as fotos na ordem das vagas, a primeira é a capa.
 */
export interface PetDetail {
  id: string;
  isActive: boolean;
  values: PetProfileValues;
  photos: PetPhoto[];
}
