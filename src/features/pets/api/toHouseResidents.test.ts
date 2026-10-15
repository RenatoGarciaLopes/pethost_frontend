import { expect, it } from "vitest";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { hostPetsSchema } from "./contracts";
import { toHouseResidents } from "./mappers";
it("REQ-HPETS-006/009 a vitrine só leva campos permitidos e ativos, na ordem da API", () => {
  const dto = hostPetsSchema.parse({
    keeper: { ...petKeeperDto, type: "host" },
    pets: [
      petDto({ microchip: "123456789012345", notes: "privado", allergies: "privado", vetContact: "privado" }),
      petDto({ isActive: false }),
    ],
  });
  expect(toHouseResidents(dto)).toEqual([
    {
      id: petDto().id,
      name: "Thor",
      species: "dog",
      speciesDescription: null,
      size: "medium",
      coverUrl: "https://cdn.pethost.test/thor.jpg",
      goodWithDogs: true,
      goodWithCats: false,
      goodWithKids: true,
    },
  ]);
});
it("REQ-HPETS-007 vitrine vazia permanece vazia", () => {
  expect(toHouseResidents(hostPetsSchema.parse({ keeper: null, pets: [] }))).toEqual([]);
});
