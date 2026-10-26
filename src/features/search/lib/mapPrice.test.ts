import { expect, it } from "vitest";
import { mapPrice } from "./mapPrice";

it("REQ-SRCH-013 pino mostra o total quando há período e pets, e a diária quando não há", () => {
  expect(mapPrice(55, { nights: 5, petCount: 1 })).toMatch(/^R\$\s275$/);
  expect(mapPrice(60.1, { nights: 5, petCount: 2 })).toMatch(/^R\$\s601$/);
  expect(mapPrice(60.1)).toMatch(/^R\$\s60,10$/);
  expect(mapPrice(60, { nights: 0, petCount: 1 })).toMatch(/^R\$\s60$/);
});
