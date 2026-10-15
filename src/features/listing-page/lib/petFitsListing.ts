export interface ListingFitRules {
  acceptedSpecies: readonly string[];
  acceptsSmall: boolean;
  acceptsMedium: boolean;
  acceptsLarge: boolean;
}

export interface ListingFitPet {
  name: string;
  species: string;
  size: string | null;
}

export type ListingFitResult = { fits: true } | { fits: false; reason: "species" | "size" };

/** Compara espécie e porte do pet com as regras do cantinho. @example petFitsListing(pet, listing) */
export function petFitsListing(pet: ListingFitPet, listing: ListingFitRules): ListingFitResult {
  if (!listing.acceptedSpecies.includes(pet.species)) return { fits: false, reason: "species" };
  if (pet.size === "small" && !listing.acceptsSmall) return { fits: false, reason: "size" };
  if (pet.size === "medium" && !listing.acceptsMedium) return { fits: false, reason: "size" };
  if (pet.size === "large" && !listing.acceptsLarge) return { fits: false, reason: "size" };
  return { fits: true };
}
