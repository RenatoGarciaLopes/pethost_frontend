/** Pet ativo fornecido pela composição da página. @example { id, name: "Luna", species: "dog", size: "medium" } */
export interface SearchPet {
  id: string;
  name: string;
  species: string;
  size: string | null;
}

/** Estado serializável; pets são ids, count atende quem não selecionou um pet. @example { pets: [], species: [], sizes: [], weekdays: [], where: "Maringá" } */
export interface SearchQuery {
  where?: string;
  state?: string;
  neighborhood?: string;
  from?: string;
  to?: string;
  pets: string[];
  count?: number;
  radius?: number;
  species: string[];
  sizes: string[];
  weekdays: string[];
  hasYard?: boolean;
  hasKids?: boolean;
  hasDogs?: boolean;
  hasCats?: boolean;
  homeType?: "house" | "apartment";
  minNightlyRate?: number;
  maxNightlyRate?: number;
  minCapacity?: number;
}

/** Pet escolhido pelo tutor; os cards conferem a compatibilidade dele com cada cantinho. @example { id, name: "Pipoca" } */
export interface CompatibilityPet {
  id: string;
  name: string;
}
