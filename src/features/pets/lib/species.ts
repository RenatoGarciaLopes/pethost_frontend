import type { PetSpecies } from "../types";
/** Porte obrigatório apenas no cachorro. @example requiresSize("dog") // true */
export const requiresSize = (species: PetSpecies): boolean => species === "dog";
/** Porte permitido na API para cachorro e gato. @example allowsSize("cat") // true */
export const allowsSize = (species: PetSpecies): boolean => species === "dog" || species === "cat";
/** Exótico precisa dizer que animal é. @example requiresDescription("exotic") // true */
export const requiresDescription = (species: PetSpecies): boolean => species === "exotic";
/** Espécies cujo peso é apresentado em gramas. @example usesGrams("hamster") // true */
export const usesGrams = (species: PetSpecies): boolean =>
  ["hamster", "canary", "parakeet", "cockatiel", "fish"].includes(species);
/** Poda campos incompatíveis sem alterar o objeto recebido. @example pruneForSpecies({ species: "rabbit", size: "small" }) */
export function pruneForSpecies<T extends { species: PetSpecies; size?: unknown; speciesDescription?: unknown }>(
  values: T,
): T {
  const pruned = { ...values };
  if (!allowsSize(values.species)) delete pruned.size;
  if (!requiresDescription(values.species)) delete pruned.speciesDescription;
  return pruned;
}
