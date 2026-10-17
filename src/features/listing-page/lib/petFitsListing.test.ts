import { describe, expect, it } from "vitest";
import { petFitsListing } from "./petFitsListing";

const listing = { acceptedSpecies: ["dog", "cat"], acceptsSmall: true, acceptsMedium: false, acceptsLarge: true };

describe("petFitsListing · REQ-LPAGE-005", () => {
  it("aceita espécie e porte compatíveis", () => {
    expect(petFitsListing({ name: "Luna", species: "dog", size: "small" }, listing)).toEqual({ fits: true });
  });
  it("identifica espécie não aceita", () => {
    expect(petFitsListing({ name: "Piu", species: "parrot", size: null }, listing)).toEqual({
      fits: false,
      reason: "species",
    });
  });
  it("identifica porte não aceito", () => {
    expect(petFitsListing({ name: "Toto", species: "dog", size: "medium" }, listing)).toEqual({
      fits: false,
      reason: "size",
    });
  });
  it("não inventa incompatibilidade de porte sem porte informado", () => {
    expect(petFitsListing({ name: "Mimi", species: "cat", size: null }, listing)).toEqual({ fits: true });
  });
});
