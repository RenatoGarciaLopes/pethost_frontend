import { describe, expect, it } from "vitest";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { createListingSchemas, type ListingFormValues } from "../schemas/listingSchema";
import { listingDtoSchema, myListingsSchema } from "./contracts";
import { toCreateListingRequest, toListing, toMyListings, toUpdateListingRequest } from "./mappers";

const person = createListingSchemas("person");
const company = createListingSchemas("company");

describe("toListing", () => {
  it("REQ-LIST-013 o cantinho vira os valores do formulário (diária em texto, nulos vazios) e a capa", () => {
    const listing = toListing(
      listingDtoSchema.parse(
        listingDto({
          houseRules: null,
          photos: [
            { id: "0199e0a0-0000-7000-8000-0000000000f2", url: "https://cdn.test/2.jpg", position: 2 },
            { id: "0199e0a0-0000-7000-8000-0000000000f1", url: "https://cdn.test/1.jpg", position: 1 },
          ],
        }),
      ),
    );
    expect(listing.values).toMatchObject({
      homeType: "house",
      nightlyRate: "60,00",
      houseRules: "",
      address: { zipCode: "87020000", complement: "", city: "Maringá" },
      availableWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
    expect(listing.nightlyRateCents).toBe(6000);
    expect(listing.photos.map((photo) => photo.url)).toEqual(["https://cdn.test/1.jpg", "https://cdn.test/2.jpg"]);
    expect(listing.coverUrl).toBe("https://cdn.test/1.jpg");
  });

  it("REQ-LIST-001 meus cantinhos: empresa, recebimento e a lista", () => {
    const mine = toMyListings(
      myListingsSchema.parse(
        myListingsDto([listingDto({ isActive: false })], { isCompany: true, payoutsEnabled: false }),
      ),
    );
    expect(mine).toMatchObject({ isCompany: true, payoutsEnabled: false });
    expect(mine.listings[0]?.isActive).toBe(false);
  });

  it("REQ-LIST-013 tipo, dia ou espécie desconhecidos não passam pelo contrato", () => {
    expect(() => listingDtoSchema.parse(listingDto({ availableWeekdays: ["holiday"] }))).toThrow();
  });
});

describe("toCreateListingRequest", () => {
  const values = toListing(listingDtoSchema.parse(listingDto())).values;

  it("REQ-LIST-011 manda tudo, a diária em reais e sem complemento vazio", () => {
    const body = toCreateListingRequest(person.listing.parse({ ...values, nightlyRate: "60,50", houseRules: "" }));
    expect(body).toMatchObject({ nightlyRate: 60.5, homeType: "house", acceptsSmall: true, capacity: 3 });
    expect(body).not.toHaveProperty("houseRules");
    expect(body.address).not.toHaveProperty("complement");
  });

  it("REQ-LIST-007 sem cachorro nem gato, os portes vão como não", () => {
    const body = toCreateListingRequest(person.listing.parse({ ...values, acceptedSpecies: ["rabbit"] }));
    expect(body).toMatchObject({ acceptsSmall: false, acceptsMedium: false, acceptsLarge: false });
  });

  it("REQ-LIST-005 empresa não manda o tipo da casa", () => {
    expect(toCreateListingRequest(company.listing.parse({ ...values, homeType: "" }))).not.toHaveProperty("homeType");
  });
});

describe("toUpdateListingRequest", () => {
  const original = toListing(listingDtoSchema.parse(listingDto())).values;
  const edit = (changes: Partial<ListingFormValues>) =>
    toUpdateListingRequest(person.listing.parse(original), person.listing.parse({ ...original, ...changes }));

  it("REQ-LIST-013 nada mudou: PATCH vazio", () => {
    expect(edit({})).toEqual({});
  });

  it("REQ-LIST-013 lista muda inteira; diária em reais", () => {
    expect(edit({ availableWeekdays: ["saturday", "sunday"], nightlyRate: "75,00" })).toEqual({
      availableWeekdays: ["saturday", "sunday"],
      nightlyRate: 75,
    });
  });

  it("REQ-LIST-013 endereço parcial; texto apagado vai como vazio", () => {
    expect(edit({ address: { ...original.address, number: "130" }, houseRules: "" })).toEqual({
      address: { number: "130" },
      houseRules: "",
    });
  });

  it("REQ-LIST-007 tirar cachorro e gato desliga os portes junto", () => {
    expect(edit({ acceptedSpecies: ["rabbit"] })).toEqual({
      acceptedSpecies: ["rabbit"],
      acceptsSmall: false,
      acceptsMedium: false,
    });
  });
});
