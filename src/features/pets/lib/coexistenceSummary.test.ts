import { expect, it } from "vitest";
import { coexistenceSummary } from "./coexistenceSummary";
it.each([
  [false, false, false, ""],
  [true, false, false, "Se dá bem com cachorro"],
  [false, true, false, "Se dá bem com gato"],
  [false, false, true, "Se dá bem com crianças"],
  [true, true, false, "Se dá bem com cachorro e gato"],
  [true, false, true, "Se dá bem com cachorro e crianças"],
  [false, true, true, "Se dá bem com gato e crianças"],
  [true, true, true, "Se dá bem com cachorro, gato e crianças"],
])("REQ-HPETS-006 convivência %s/%s/%s", (goodWithDogs, goodWithCats, goodWithKids, expected) => {
  expect(coexistenceSummary({ goodWithDogs, goodWithCats, goodWithKids })).toBe(expected);
});
