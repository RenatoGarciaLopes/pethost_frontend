import { describe, expect, it } from "vitest";
import type { Pet } from "../types";
import { ageLabel, describePet, sizeLabel, speciesLabel } from "./describePet";

const NOW = new Date("2026-10-13T12:00:00-03:00");

function pet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: "0199d2a0-0000-7000-8000-000000000001",
    name: "Luna",
    species: "dog",
    speciesDescription: null,
    breed: "Vira-lata",
    size: "medium",
    birthDate: "2022-06-01",
    sex: "female",
    isNeutered: true,
    coverUrl: null,
    isActive: true,
    ...overrides,
  };
}

describe("REQ-PETS-011 resumo da carteirinha", () => {
  it("cão com raça, porte, idade, sexo e castração", () => {
    expect(describePet(pet(), NOW)).toBe("Vira-lata · porte médio · 4 anos · fêmea · castrada");
  });

  it("macho castrado; sem raça usa a espécie", () => {
    expect(describePet(pet({ breed: null, sex: "male" }), NOW)).toBe(
      "Cachorro · porte médio · 4 anos · macho · castrado",
    );
  });

  it("exótico usa a descrição; sem porte, sem data, sexo desconhecido e sem castração ficam de fora", () => {
    expect(
      describePet(
        pet({
          species: "exotic",
          speciesDescription: "Iguana verde",
          breed: null,
          size: null,
          birthDate: null,
          sex: "unknown",
          isNeutered: false,
        }),
        NOW,
      ),
    ).toBe("Iguana verde");
  });

  it("sexo desconhecido fica fora do resumo; a castração usa a forma padrão", () => {
    expect(describePet(pet({ sex: "unknown", breed: null, size: null, birthDate: null }), NOW)).toBe(
      "Cachorro · castrado",
    );
  });
});

describe("REQ-PETS-011 idade", () => {
  it.each([
    ["2022-06-01", "4 anos"],
    ["2025-10-13", "1 ano"],
    ["2025-10-14", "11 meses"],
    ["2026-09-13", "1 mês"],
    ["2026-10-01", "menos de 1 mês"],
  ])("nascido em %s → %s (arredonda para baixo)", (birthDate, label) => {
    expect(ageLabel(birthDate, NOW)).toBe(label);
  });

  it("sem data ou data no futuro não mostra idade", () => {
    expect(ageLabel(null, NOW)).toBeNull();
    expect(ageLabel("2027-01-01", NOW)).toBeNull();
  });
});

describe("REQ-PETS-011 rótulos", () => {
  it.each([
    ["dog", "Cachorro"],
    ["guinea_pig", "Porquinho-da-índia"],
    ["turtle", "Tartaruga ou jabuti"],
  ] as const)("%s → %s", (species, label) => {
    expect(speciesLabel(species, null)).toBe(label);
  });

  it("exótico sem descrição cai em 'Outro bicho'", () => {
    expect(speciesLabel("exotic", "Iguana")).toBe("Iguana");
    expect(speciesLabel("exotic", null)).toBe("Outro bicho");
  });

  it("porte", () => {
    expect(sizeLabel("small")).toBe("porte pequeno");
    expect(sizeLabel("large")).toBe("porte grande");
  });
});
