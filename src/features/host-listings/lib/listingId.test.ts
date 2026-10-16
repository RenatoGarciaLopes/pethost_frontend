import { expect, it } from "vitest";
import { isListingId } from "./listingId";

it("REQ-LIST-013 só UUID é id de cantinho; o resto vai direto para o 404", () => {
  expect(isListingId("0199e0a0-0000-7000-8000-0000000000c1")).toBe(true);
  expect(isListingId("casa-da-cida")).toBe(false);
});
