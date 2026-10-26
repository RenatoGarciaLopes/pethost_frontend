import { expect, it, vi, afterEach } from "vitest";
import { petProfileSchema, petStepSchemas, bodyStepSchema, speciesSectionSchema } from "./petProfileSchema";
const minimum = {
  species: "dog",
  name: " Mel ",
  size: "small",
  sex: "unknown",
  isVaccinated: false,
  isNeutered: false,
  goodWithDogs: false,
  goodWithCats: false,
  goodWithKids: false,
};
afterEach(() => vi.useRealTimers());
it("REQ-PNEW-023 ficha mínima aceita respostas não e normaliza o nome", () => {
  expect(petProfileSchema.parse(minimum).name).toBe("Mel");
});
it("REQ-PNEW-004/005 cão exige porte; exótico descrição; demais espécies podam campos", () => {
  expect(petProfileSchema.safeParse({ ...minimum, size: undefined }).success).toBe(false);
  expect(petProfileSchema.safeParse({ ...minimum, species: "exotic" }).success).toBe(false);
  expect(petProfileSchema.parse({ ...minimum, species: "rabbit", speciesDescription: "teste" })).not.toHaveProperty(
    "size",
  );
  expect(petProfileSchema.parse({ ...minimum, species: "cat" }).size).toBe("small");
});
it.each(["name", "sex", "isVaccinated", "isNeutered", "goodWithDogs", "goodWithCats", "goodWithKids"])(
  "REQ-PNEW-023 campo obrigatório %s não é inventado",
  (field) => {
    expect(petProfileSchema.safeParse({ ...minimum, [field]: undefined }).success).toBe(false);
  },
);
it.each([
  ["name", 60],
  ["breed", 60],
  ["speciesDescription", 60],
  ["medicationNotes", 1000],
  ["feedingNotes", 1000],
  ["allergies", 1000],
  ["vetContact", 160],
  ["notes", 2000],
] as const)("REQ-PNEW-003/006/009/010/011 limite de %s é %s", (field, limit) => {
  const base = { ...minimum, species: field === "speciesDescription" ? "exotic" : "dog" };
  expect(petProfileSchema.safeParse({ ...base, [field]: "a".repeat(limit) }).success).toBe(true);
  expect(petProfileSchema.safeParse({ ...base, [field]: "a".repeat(limit + 1) }).success).toBe(false);
});
it("REQ-PNEW-009 data real sem futuro e peso positivo até 150 com três casas", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-14T12:00:00Z"));
  for (const birthDate of ["2026-10-15", "2025-02-29", "14/10/2026", "2026-02-30"])
    expect(petProfileSchema.safeParse({ ...minimum, birthDate }).success).toBe(false);
  expect(petProfileSchema.safeParse({ ...minimum, birthDate: "2024-02-29", weightKg: 0.035 }).success).toBe(true);
  for (const weightKg of [0, -1, 150.001, 1.0001, Infinity, NaN])
    expect(petProfileSchema.safeParse({ ...minimum, weightKg }).success).toBe(false);
  expect(petProfileSchema.safeParse({ ...minimum, weightKg: 150 }).success).toBe(true);
});
it("REQ-PNEW-010 textos vazios somem e microchip aceita separadores", () => {
  const value = petProfileSchema.parse({ ...minimum, breed: "  ", notes: " ", microchip: "123 456-789012345" });
  expect(value.breed).toBeUndefined();
  expect(value.notes).toBeUndefined();
  expect(value.microchip).toBe("123456789012345");
  expect(petProfileSchema.safeParse({ ...minimum, microchip: "123" }).success).toBe(false);
});
it("REQ-PNEW-014 recortes não exigem campos de outros passos e corpo usa fábrica", () => {
  expect(petStepSchemas.identity.parse({ name: "Mel", sex: "female" })).toEqual({ name: "Mel", sex: "female" });
  expect(petStepSchemas.species.safeParse({ species: "exotic" }).success).toBe(false);
  expect(bodyStepSchema("dog").safeParse({}).success).toBe(false);
  expect(bodyStepSchema("cat").parse({})).toEqual({});
  expect(bodyStepSchema("rabbit").parse({ size: "large" })).not.toHaveProperty("size");
  expect(petStepSchemas.health.safeParse({ isVaccinated: false, isNeutered: true }).success).toBe(true);
  expect(petStepSchemas.routine.parse({})).toEqual({});
  expect(
    petStepSchemas.social.safeParse({ goodWithDogs: false, goodWithCats: true, goodWithKids: false }).success,
  ).toBe(true);
});

it("REQ-PEDIT-006 na edição o peso já informado pode trocar, mas não ficar em branco", () => {
  const keep = bodyStepSchema("cat", { keepWeight: true });
  expect(keep.safeParse({}).error?.issues[0]).toMatchObject({
    path: ["weightKg"],
    message: "Dá pra trocar o peso, mas não deixar em branco.",
  });
  expect(keep.parse({ weightKg: 4.2 })).toEqual({ weightKg: 4.2 });
  expect(bodyStepSchema("cat").parse({})).toEqual({});
});

it("REQ-PEDIT-007 a seção Bicho pede o porte ao virar cachorro e a descrição ao virar exótico", () => {
  expect(speciesSectionSchema.safeParse({ species: "dog" }).error?.issues[0].path).toEqual(["size"]);
  expect(speciesSectionSchema.parse({ species: "dog", size: "large" })).toEqual({ species: "dog", size: "large" });
  expect(speciesSectionSchema.safeParse({ species: "exotic" }).error?.issues[0].path).toEqual(["speciesDescription"]);
  expect(speciesSectionSchema.parse({ species: "cat", size: "small" })).toEqual({ species: "cat", size: "small" });
  expect(speciesSectionSchema.parse({ species: "rabbit", size: "small", speciesDescription: "x" })).toEqual({
    species: "rabbit",
  });
});
