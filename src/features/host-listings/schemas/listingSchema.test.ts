import { describe, expect, it } from "vitest";
import { listingCopy } from "../lib/listingCopy";
import { createListingSchemas, emptyListingValues, type ListingFormValues, type ListingValues } from "./listingSchema";

const errors = listingCopy.errors;
const person = createListingSchemas("person");
const company = createListingSchemas("company");

const complete: ListingFormValues = {
  ...emptyListingValues,
  homeType: "house",
  hasYard: true,
  title: "Casa da Cida",
  description: "Casa térrea com quintal.",
  hasDogs: true,
  hasCats: false,
  hasKids: false,
  acceptedSpecies: ["dog", "rabbit"],
  acceptsSmall: true,
  capacity: 3,
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
  availableWeekdays: ["monday", "saturday"],
  nightlyRate: "60,50",
};

const messages = (result: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));

describe("listingSchema", () => {
  it("REQ-LIST-003 cantinho completo passa e a diária vira centavos", () => {
    const parsed: ListingValues = person.listing.parse(complete);
    expect(parsed.nightlyRateCents).toBe(6050);
    expect(parsed.homeType).toBe("house");
  });

  it("REQ-LIST-003 rascunho vazio: só as regras da casa (opcionais) passam", () => {
    const passing = Object.entries(person.sections)
      .filter(([, schema]) => schema.safeParse(emptyListingValues).success)
      .map(([id]) => id);
    expect(passing).toEqual(["rules"]);
  });

  it("REQ-LIST-005 pessoa física precisa do tipo da casa; empresa não tem tipo", () => {
    expect(messages(person.sections.home.safeParse({ ...complete, homeType: "" }))).toEqual({
      homeType: errors.homeType,
    });
    expect(company.sections.home.parse({ ...complete, homeType: "" })).not.toHaveProperty("homeType");
  });

  it("REQ-LIST-005 título até 80, descrição obrigatória até 4000, quintal respondido", () => {
    expect(
      messages(person.sections.home.safeParse({ ...complete, title: "a".repeat(81), description: " ", hasYard: null })),
    ).toEqual({ title: errors.titleLength, description: errors.description, hasYard: errors.yesNo });
  });

  it("REQ-LIST-006 quem mora na casa: sim ou não para cada um", () => {
    expect(messages(person.sections.household.safeParse({ ...complete, hasKids: null }))).toEqual({
      hasKids: errors.yesNo,
    });
  });

  it("REQ-LIST-007 ao menos um tipo; porte só é obrigatório com cachorro ou gato", () => {
    expect(messages(person.sections.guests.safeParse({ ...complete, acceptedSpecies: [] }))).toEqual({
      acceptedSpecies: errors.species,
    });
    expect(messages(person.sections.guests.safeParse({ ...complete, acceptsSmall: false }))).toEqual({
      acceptsSmall: errors.sizes,
    });
    expect(
      person.sections.guests.safeParse({ ...complete, acceptedSpecies: ["rabbit"], acceptsSmall: false }).success,
    ).toBe(true);
  });

  it("REQ-LIST-007 capacidade de 1 a 10 (pessoa física) ou 1 a 200 (empresa)", () => {
    expect(messages(person.sections.guests.safeParse({ ...complete, capacity: 11 }))).toEqual({
      capacity: errors.capacity(10),
    });
    expect(company.sections.guests.safeParse({ ...complete, capacity: 200 }).success).toBe(true);
    expect(messages(company.sections.guests.safeParse({ ...complete, capacity: 0 }))).toEqual({
      capacity: errors.capacity(200),
    });
  });

  it.each([
    ["10,00", 1000],
    ["10.000,00", 1000000],
    ["R$ 75", 7500],
    ["75,5", 7550],
  ])("REQ-LIST-009 diária %s vira %i centavos", (text, cents) => {
    expect(person.sections.rate.parse({ ...complete, nightlyRate: text }).nightlyRateCents).toBe(cents);
  });

  it.each(["9,99", "10.000,01", "60,505", "", "abc"])("REQ-LIST-009 diária %s é recusada", (text) => {
    expect(messages(person.sections.rate.safeParse({ ...complete, nightlyRate: text }))).toEqual({
      nightlyRate: errors.rate,
    });
  });

  it("REQ-LIST-010 ao menos um dia; regras opcionais até 2000", () => {
    expect(messages(person.sections.weekdays.safeParse({ ...complete, availableWeekdays: [] }))).toEqual({
      availableWeekdays: errors.weekdays,
    });
    expect(person.sections.rules.safeParse({ ...complete, houseRules: "" }).success).toBe(true);
    expect(messages(person.sections.rules.safeParse({ ...complete, houseRules: "a".repeat(2001) }))).toEqual({
      houseRules: errors.tooLong(2000),
    });
  });

  it("REQ-LIST-008 endereço com as regras da conta (CEP com 8 números)", () => {
    expect(
      messages(person.sections.address.safeParse({ ...complete, address: { ...complete.address, zipCode: "870" } })),
    ).toEqual({ "address.zipCode": errors.address.zipCode });
  });
});
