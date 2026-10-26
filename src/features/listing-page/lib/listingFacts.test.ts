import { describe, expect, it } from "vitest";
import { compatibilityReasons, houseLine, houseRuleItems } from "./listingFacts";

const house = { homeType: "house", hasYard: true, hasDogs: true, hasCats: false, hasKids: true } as const;

describe("houseLine · REQ-LPAGE-001", () => {
  it("descreve a casa e quem mora nela", () => {
    expect(houseLine(house)).toBe("casa com quintal · tem cachorro · tem criança");
  });

  it("sem tipo informado (empresa) e sem ninguém em casa, fica só o quintal ou nada", () => {
    expect(houseLine({ homeType: null, hasYard: true, hasDogs: false, hasCats: false, hasKids: false })).toBe(
      "com quintal",
    );
    expect(houseLine({ homeType: null, hasYard: false, hasDogs: false, hasCats: false, hasKids: false })).toBe("");
  });
});

describe("houseRuleItems · REQ-LPAGE-001", () => {
  const rules = {
    houseRules: "- Pode subir no sofá\n\n• Buscar até as 18h  ",
    acceptedSpecies: ["dog", "cat"],
    acceptsSmall: true,
    acceptsMedium: true,
    acceptsLarge: false,
    capacity: 2,
    availableWeekdays: ["monday", "friday", "saturday"],
  };

  it("lista as regras escritas sem marcador e depois o que a casa aceita", () => {
    expect(houseRuleItems(rules)).toEqual([
      "Pode subir no sofá",
      "Buscar até as 18h",
      "Recebe cachorro e gato, de porte pequeno e médio",
      "Até 2 pets por vez",
      "Recebe nos dias: segunda, sexta e sábado",
    ]);
  });

  it("sem regras escritas e com um pet por vez, mostra só o que vem do cadastro", () => {
    expect(houseRuleItems({ ...rules, houseRules: null, capacity: 1, availableWeekdays: [] })).toEqual([
      "Recebe cachorro e gato, de porte pequeno e médio",
      "Um pet por vez",
    ]);
  });
});

describe("compatibilityReasons", () => {
  it("explica tipo, porte e quem mora na casa", () => {
    expect(compatibilityReasons(house, { species: "dog", size: "medium" })).toEqual([
      "aceita cachorro de porte médio",
      "tem cachorro em casa",
      "sem gato em casa",
      "tem criança em casa",
    ]);
  });

  it("pet sem porte não ganha porte inventado", () => {
    expect(
      compatibilityReasons({ hasDogs: false, hasCats: true, hasKids: false }, { species: "cat", size: null }),
    ).toEqual(["aceita gato", "sem cachorro em casa", "tem gato em casa"]);
  });
});
