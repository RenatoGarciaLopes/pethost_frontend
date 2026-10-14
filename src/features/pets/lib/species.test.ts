import { expect, it } from "vitest";
import { PET_SPECIES } from "../api/contracts";
import { allowsSize, requiresDescription, requiresSize, usesGrams, pruneForSpecies } from "./species";
it.each(PET_SPECIES)("REQ-PNEW-003/004/005 regras da espécie %s", (species) => {
  expect(requiresSize(species)).toBe(species === "dog");
  expect(allowsSize(species)).toBe(["dog", "cat"].includes(species));
  expect(requiresDescription(species)).toBe(species === "exotic");
  expect(usesGrams(species)).toBe(["hamster", "canary", "parakeet", "cockatiel", "fish"].includes(species));
});
it("REQ-PNEW-005 trocar espécie poda apenas os campos incompatíveis sem mutar", () => {
  const input = { species: "rabbit" as const, size: "large" as const, speciesDescription: "Iguana", name: "Mel" };
  expect(pruneForSpecies(input)).toEqual({ species: "rabbit", name: "Mel" });
  expect(input.size).toBe("large");
  expect(pruneForSpecies({ ...input, species: "cat" })).toEqual({ species: "cat", size: "large", name: "Mel" });
  expect(pruneForSpecies({ ...input, species: "exotic" })).toEqual({
    species: "exotic",
    speciesDescription: "Iguana",
    name: "Mel",
  });
});
