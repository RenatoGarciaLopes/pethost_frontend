import { expect, it } from "vitest";
import { contrastRatio } from "./contrastRatio";

it("REQ-DS-002 calcula extremos, simetria e hex curto", () => {
  expect(contrastRatio("#000", "#fff")).toBe(21);
  expect(contrastRatio("#123456", "#123456")).toBe(1);
  expect(contrastRatio("#abc", "#000")).toBe(contrastRatio("#000", "#AABBCC"));
});
it("REQ-DS-002 rejeita entradas que não sejam hex RGB", () => {
  for (const input of ["red", "#ffff", "#gggggg", "123456"]) expect(() => contrastRatio(input, "#fff")).toThrow(/hex/i);
});
