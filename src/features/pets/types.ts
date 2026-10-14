import type { z } from "zod";
import type { petSexSchema, petSizeSchema, petSpeciesSchema } from "./api/contracts";

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
  active: Pet[];
  inactive: Pet[];
}
