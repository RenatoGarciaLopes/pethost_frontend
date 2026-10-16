import { describe, expect, it } from "vitest";
import { netEarnings } from "./netEarnings";

describe("netEarnings", () => {
  it("REQ-LIST-009 o anfitrião recebe 90% de diária × pets × noites, em centavos", () => {
    // R$ 60,00 × 2 pets × 10 noites = R$ 1.200,00; 90% = R$ 1.080,00.
    expect(netEarnings(6000, 2, 10)).toBe(108000);
  });

  it("REQ-LIST-009 arredonda a parte da PetHost para o centavo e o anfitrião fica com o resto", () => {
    // R$ 10,05 × 1 × 1 = 1005 centavos; 10% = 100,5 → 101; anfitrião 904.
    expect(netEarnings(1005, 1, 1)).toBe(904);
    expect(Number.isInteger(netEarnings(3333, 3, 7))).toBe(true);
  });

  it("REQ-LIST-009 sem pets ou sem noites, nada", () => {
    expect(netEarnings(6000, 0, 10)).toBe(0);
    expect(netEarnings(6000, 2, 0)).toBe(0);
  });
});
