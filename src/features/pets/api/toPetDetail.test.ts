import { expect, it } from "vitest";
import { petDto } from "@/test/fixtures/pets";
import { petDtoSchema } from "./contracts";
import { toPetDetail, toPetProfileValues } from "./toPetDetail";

it("REQ-PEDIT-001 converte nulos e preserva falsos e porte de gato", () => {
  const dto = petDtoSchema.parse(petDto({ species: "cat", weightKg: null, speciesDescription: "indevida" }));
  const values = toPetProfileValues(dto);
  expect(values).not.toHaveProperty("weightKg");
  expect(values).not.toHaveProperty("speciesDescription");
  expect(values.size).toBe("medium");
  expect(values.goodWithCats).toBe(false);
  expect(toPetDetail(dto)).toEqual({ id: dto.id, isActive: true, values, photos: dto.photos });
});
it("REQ-PEDIT-001 preserva descrição exótica e remove porte incompatível", () => {
  const values = toPetProfileValues(petDtoSchema.parse(petDto({ species: "exotic", speciesDescription: "Iguana" })));
  expect(values.speciesDescription).toBe("Iguana");
  expect(values).not.toHaveProperty("size");
});
it("REQ-PEDIT-001 converte todos os opcionais sem perder valores e não inventa porte", () => {
  const dto = petDtoSchema.parse(
    petDto({
      species: "cat",
      size: null,
      breed: null,
      birthDate: null,
      weightKg: null,
      medicationNotes: "Dose ao jantar",
      feedingNotes: "Duas vezes ao dia",
      vetContact: "Clínica sintética",
      notes: "Prefere silêncio",
      microchip: "123456789012345",
      allergies: "Pólen",
      isActive: false,
    }),
  );
  const detail = toPetDetail(dto);
  expect(detail.isActive).toBe(false);
  expect(detail.photos).toEqual(dto.photos);
  expect(detail.values).toMatchObject({
    medicationNotes: dto.medicationNotes,
    feedingNotes: dto.feedingNotes,
    vetContact: dto.vetContact,
    notes: dto.notes,
    microchip: dto.microchip,
    allergies: dto.allergies,
  });
  for (const key of ["size", "breed", "birthDate", "weightKg"]) expect(detail.values).not.toHaveProperty(key);
});
