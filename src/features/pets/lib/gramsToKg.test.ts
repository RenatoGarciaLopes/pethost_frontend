import { expect, it } from "vitest";
import { gramsToKg } from "./gramsToKg";
it.each([
  [35, 0.035],
  [1500, 1.5],
  [35.6, 0.036],
  [0, 0],
])("REQ-PNEW-009 %s gramas vira %s kg", (grams, kg) => expect(gramsToKg(grams)).toBe(kg));
