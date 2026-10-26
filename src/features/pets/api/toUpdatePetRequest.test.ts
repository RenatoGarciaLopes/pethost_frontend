import { expect, it } from "vitest";
import { petProfileValuesFixture } from "@/test/fixtures/pets";
import { petProfileSchema } from "../schemas/petProfileSchema";
import { toUpdatePetRequest } from "./toUpdatePetRequest";

const profile = (overrides: Record<string, unknown> = {}) =>
  petProfileSchema.parse({ ...petProfileValuesFixture, ...overrides });

it("REQ-PEDIT-005 envia somente alterações, preservando false e texto normalizado", () => {
  expect(toUpdatePetRequest(profile(), profile({ name: " Lua ", isVaccinated: false }))).toEqual({
    name: "Lua",
    isVaccinated: false,
  });
  expect(toUpdatePetRequest(profile(), profile({ name: " Mel " }))).toEqual({});
});

it.each(["breed", "birthDate", "medicationNotes", "feedingNotes", "vetContact", "notes", "microchip", "allergies"])(
  "REQ-PEDIT-005 limpa %s com string vazia",
  (field) => {
    const value = field === "birthDate" ? "2020-01-01" : field === "microchip" ? "123456789012345" : "Texto";
    expect(toUpdatePetRequest(profile({ [field]: value }), profile({ [field]: " " }))).toEqual({ [field]: "" });
  },
);

it("REQ-PEDIT-005 compara microchip normalizado e não altera entradas", () => {
  const original = Object.freeze({ ...profile(), microchip: "123-456 789012345" });
  const edited = Object.freeze(profile({ microchip: "123456789012345" }));
  expect(toUpdatePetRequest(original, edited)).toEqual({});
  expect(original.microchip).toBe("123-456 789012345");
});

it("REQ-PEDIT-006 omite peso apagado e envia peso novo", () => {
  expect(toUpdatePetRequest(profile({ weightKg: 2 }), profile())).toEqual({});
  expect(toUpdatePetRequest(profile({ weightKg: 2 }), profile({ weightKg: 3 }))).toEqual({ weightKg: 3 });
});

it("REQ-PEDIT-007 envia porte junto ao virar cachorro mesmo sem alteração de porte", () => {
  expect(toUpdatePetRequest(profile({ species: "cat" }), profile())).toEqual({ species: "dog", size: "small" });
  expect(toUpdatePetRequest(profile(), profile({ species: "cat" }))).toEqual({ species: "cat" });
});

it("REQ-PEDIT-007 deixa a API limpar campos incompatíveis e acompanha descrição ao virar exótico", () => {
  expect(toUpdatePetRequest(profile(), profile({ species: "rabbit" }))).toEqual({ species: "rabbit" });
  const exotic = profile({ species: "exotic", speciesDescription: "Iguana" });
  expect(toUpdatePetRequest(profile(), exotic)).toEqual({ species: "exotic", speciesDescription: "Iguana" });
  expect(toUpdatePetRequest(exotic, profile({ species: "cat", size: undefined }))).toEqual({ species: "cat" });
});

it("REQ-PEDIT-005 valida o corpo pelo contrato gerado", () => {
  const edited = { ...profile(), name: 12 } as unknown as ReturnType<typeof profile>;
  expect(() => toUpdatePetRequest(profile(), edited)).toThrow();
});
