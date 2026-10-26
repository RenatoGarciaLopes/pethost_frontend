/**
 * Ficha do pet (spec 022).
 * @example petPath(pet.id) // "/pets/0199…"
 */
export const petPath = (petId: string) => `/pets/${petId}`;

/**
 * Edição da ficha por seções (spec 022).
 * @example petEditPath(pet.id) // "/pets/0199…/edit"
 */
export const petEditPath = (petId: string) => `${petPath(petId)}/edit`;
