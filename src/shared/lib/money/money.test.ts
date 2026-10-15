import { expect, it } from "vitest";
import { formatBRL, fromCents, toCents } from "./index";

it("REQ-SRCH-007 formata reais e faz a conta em centavos", () => {
  expect(formatBRL(60)).toMatch(/R\$\s60,00/);
  expect(toCents(10.29)).toBe(1029);
  expect(fromCents(1029)).toBe(10.29);
  expect(formatBRL(fromCents(toCents(60.1) * 5 * 2))).toMatch(/R\$\s601,00/);
});
