import { describe, expect, it } from "vitest";
import { formatBRL, fromCents, toCents } from "./index";

/** O Intl usa espaço não separável entre "R$" e o número; o teste compara com espaço comum. */
const plain = (text: string) => text.replace(/\s/g, " ");

describe("dinheiro", () => {
  it("REQ-LIST-009 formata reais no padrão brasileiro", () => {
    expect(plain(formatBRL(1080))).toBe("R$ 1.080,00");
    expect(plain(formatBRL(10.5))).toBe("R$ 10,50");
    expect(plain(formatBRL(0))).toBe("R$ 0,00");
  });

  it("REQ-LIST-009 reais ↔ centavos inteiros, sem erro de ponto flutuante", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(10000)).toBe(1000000);
    expect(fromCents(1999)).toBe(19.99);
    expect(fromCents(toCents(57.3))).toBe(57.3);
  });

  it("REQ-SRCH-007 formata reais e faz a conta em centavos", () => {
    expect(plain(formatBRL(60))).toBe("R$ 60,00");
    expect(toCents(10.29)).toBe(1029);
    expect(fromCents(1029)).toBe(10.29);
    expect(plain(formatBRL(fromCents(toCents(60.1) * 5 * 2)))).toBe("R$ 601,00");
  });
});
