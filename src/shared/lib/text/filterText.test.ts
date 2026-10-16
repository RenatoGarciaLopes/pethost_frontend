import { expect, it } from "vitest";
import { filterText } from "./filterText";
it("REQ-AACC-003 busca normaliza acentos, caixa e espaços sem alterar pontuação", () => {
  expect(filterText("  JOÃO Ávila  ")).toBe("joao avila");
  expect(filterText("A+B@Example.Test")).toBe("a+b@example.test");
  expect(filterText("")).toBe("");
});
