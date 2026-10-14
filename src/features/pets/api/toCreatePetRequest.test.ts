import { expect, it } from "vitest";
import { petProfileSchema } from "../schemas/petProfileSchema";
import { toCreatePetRequest } from "./mappers";
it("REQ-PNEW-016 mapper entrega corpo numérico, normalizado e sem campos vazios", () => {
  const values = petProfileSchema.parse({
    species: "hamster",
    name: " Mel ",
    size: "large",
    speciesDescription: "extra",
    sex: "unknown",
    isNeutered: false,
    isVaccinated: false,
    goodWithDogs: false,
    goodWithCats: false,
    goodWithKids: false,
    weightKg: 0.035,
    breed: " ",
    microchip: "123-456789012345",
  });
  expect(toCreatePetRequest(values)).toEqual({
    species: "hamster",
    name: "Mel",
    sex: "unknown",
    isNeutered: false,
    isVaccinated: false,
    goodWithDogs: false,
    goodWithCats: false,
    goodWithKids: false,
    weightKg: 0.035,
    microchip: "123456789012345",
  });
});
