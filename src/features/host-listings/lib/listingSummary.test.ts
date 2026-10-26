import { describe, expect, it } from "vitest";
import { emptyListingValues } from "../schemas/listingSchema";
import { acceptedSpeciesText, listingSummary, rateTexts } from "./listingSummary";

const values = {
  ...emptyListingValues,
  homeType: "house" as const,
  hasYard: true,
  title: " Casa da Cida ",
  hasDogs: true,
  hasCats: false,
  hasKids: false,
  acceptedSpecies: ["cat", "dog", "rabbit"],
  acceptsSmall: true,
  acceptsMedium: true,
  capacity: 2,
  address: {
    ...emptyListingValues.address,
    street: "Rua A",
    number: "10",
    neighborhood: "Zona 7",
    city: "Maringá",
    state: "PR",
  },
  availableWeekdays: ["friday", "monday"],
  nightlyRate: "60,00",
};

describe("listingSummary", () => {
  it("104 uma linha por passo, no tom da prancha", () => {
    expect(listingSummary(values)).toEqual({
      home: "Casa · com quintal",
      title: "Casa da Cida",
      household: "Mora cachorro · Sem gato · Sem criança",
      guests: "Cachorro, gato e coelho · porte P e M · até 2 pets por vez",
      address: "Rua A, 10 · Zona 7 · Maringá/PR",
      rules: "Sem regras escritas.",
      weekdays: "Seg e Sex",
      rate: expect.stringMatching(/^R\$\s60,00 por noite, por pet · você recebe R\$\s54,00$/),
    });
  });

  it("104 sem cachorro nem gato o porte some; a semana inteira vira 'Todos os dias'; empresa sem tipo", () => {
    const summary = listingSummary({
      ...values,
      homeType: "",
      hasYard: false,
      acceptedSpecies: ["fish"],
      capacity: 1,
      availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    });
    expect(summary.home).toBe("Sem quintal");
    expect(summary.guests).toBe("Peixe · 1 pet por vez");
    expect(summary.weekdays).toBe("Todos os dias");
  });

  it("104 diária que ainda não é valor não vira texto", () => {
    expect(rateTexts("abc")).toBeNull();
    expect(acceptedSpeciesText([])).toBe("");
  });
});
