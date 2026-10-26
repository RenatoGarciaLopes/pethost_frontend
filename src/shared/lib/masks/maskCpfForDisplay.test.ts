import { expect, it } from "vitest";
import { maskCpfForDisplay } from "./maskCpfForDisplay";
it.each(["52998224725", "529.982.247-25"])("REQ-ACC-013 só revela os cinco últimos dígitos de %s", (cpf) => {
  expect(maskCpfForDisplay(cpf)).toBe("***.***.247-25");
});
it("REQ-ACC-013 CPF ausente não inventa documento", () => {
  expect(maskCpfForDisplay(null)).toBe("");
  expect(maskCpfForDisplay("")).toBe("");
});
