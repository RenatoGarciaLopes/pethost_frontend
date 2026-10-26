import { describe, expect, it } from "vitest";
import { listingErrors } from "../schemas/listingResolver";
import { createListingSchemas, emptyListingValues } from "../schemas/listingSchema";
import { firstStepWithError, LISTING_STEP_IDS, REVIEW_INDEX, stepIndexOf, toFormField } from "./listingSteps";

describe("listingSteps", () => {
  it("104 campo da API vira o campo do formulário; o que não é da tela volta como veio", () => {
    expect(toFormField("address.zipCode")).toBe("address.zipCode");
    expect(toFormField("acceptedSpecies[0]")).toBe("acceptedSpecies");
    expect(toFormField("status")).toBe("status");
  });

  it("REQ-LIST-012 acha o primeiro passo dos campos com erro", () => {
    expect(stepIndexOf(["nightlyRate", "address.zipCode"])).toBe(LISTING_STEP_IDS.indexOf("address"));
    expect(stepIndexOf(["status"])).toBeUndefined();
  });

  it("104 rascunho antigo retoma no primeiro passo que falta; sem falta, na revisão", () => {
    const schemas = createListingSchemas("person");
    expect(firstStepWithError(listingErrors(schemas, emptyListingValues))).toBe(0);
    const answered = { ...emptyListingValues, homeType: "house" as const, hasYard: false };
    expect(LISTING_STEP_IDS[firstStepWithError(listingErrors(schemas, answered))]).toBe("title");
    expect(firstStepWithError({})).toBe(REVIEW_INDEX);
  });

  it("104 os portes são conferidos mesmo com outros passos em branco", () => {
    const errors = listingErrors(createListingSchemas("person"), { ...emptyListingValues, acceptedSpecies: ["dog"] });
    expect(errors.acceptsSmall?.message).toBe("Com cachorro ou gato, escolhe ao menos um porte.");
  });
});
