import type { PetSpecies } from "../types";
import { allowsSize, requiresDescription, requiresSize } from "./species";

/** Campos afetados pelas regras de espécie; não representa todos os campos da ficha.
 * @example const field: SpeciesField = "size";
 */
export type SpeciesField = "size" | "speciesDescription";

/**
 * Descreve remoções e novas exigências da espécie (REQ-PEDIT-007), sem alterar valores.
 * A tela deve filtrar os avisos de remoção pelos campos efetivamente preenchidos.
 * @example speciesChangeEffects("dog", "rabbit") // { removes: ["size"], requires: [] }
 */
export function speciesChangeEffects(
  from: PetSpecies,
  to: PetSpecies,
): { removes: SpeciesField[]; requires: SpeciesField[] } {
  const removes: SpeciesField[] = [];
  const requires: SpeciesField[] = [];
  if (from === to) return { removes, requires };
  if (allowsSize(from) && !allowsSize(to)) removes.push("size");
  if (requiresDescription(from) && !requiresDescription(to)) removes.push("speciesDescription");
  if (requiresSize(to) && !requiresSize(from)) requires.push("size");
  if (requiresDescription(to) && !requiresDescription(from)) requires.push("speciesDescription");
  return { removes, requires };
}
