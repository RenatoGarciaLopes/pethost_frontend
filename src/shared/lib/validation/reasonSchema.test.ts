import { expect, it } from "vitest";
import { reasonSchema } from "./reasonSchema";
it("REQ-AACC-005/007/015 motivo aparado exige 1 a 500 caracteres", () => {
  expect(reasonSchema.parse({ reason: " conferido " })).toEqual({ reason: "conferido" });
  expect(reasonSchema.safeParse({ reason: " " }).success).toBe(false);
  expect(reasonSchema.safeParse({ reason: "a".repeat(501) }).success).toBe(false);
  expect(reasonSchema.safeParse({ reason: "a".repeat(500) }).success).toBe(true);
});
