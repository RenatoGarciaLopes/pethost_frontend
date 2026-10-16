import { expect, it } from "vitest";
import { quintalRadiusCss, quintalRadii, radius } from "./radii";

it("REQ-UIC-001 maps each named radius to a numeric theme token and CSS value", () => {
  expect(quintalRadii).toEqual({ control: 12, media: 16, field: 18, card: 24, pill: 999 });
  expect(quintalRadiusCss).toEqual({ control: "12px", media: "16px", field: "18px", card: "24px", pill: "999px" });
  expect(radius("card")).toBe("24px");
});
