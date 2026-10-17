import { describe, expect, it } from "vitest";
import { stayTotal } from "./stayTotal";

describe("stayTotal · REQ-LPAGE-004", () => {
  it("calcula diária × noites × pets em centavos", () => {
    expect(stayTotal(60.1, "2026-10-15", "2026-10-20", 2)).toMatch(/R\$\s*601,00/);
  });
  it("retorna nulo quando faltam parâmetros ou o período é inválido", () => {
    expect(stayTotal(60, undefined, undefined, 1)).toBeNull();
    expect(stayTotal(60, "2026-10-20", "2026-10-15", 2)).toBeNull();
  });
});
