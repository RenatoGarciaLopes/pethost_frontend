import { describe, expect, it } from "vitest";
import { addDays, brasiliaToday } from "./stayRules";

describe("stayRules", () => {
  it("REQ-STDAY-008 o dia de hoje é o de Brasília (UTC-3 fixo), não o do navegador", () => {
    // 23h do dia 19 em Brasília = 02h UTC do dia 20.
    expect(brasiliaToday(new Date("2026-12-20T02:00:00Z"))).toBe("2026-12-19");
    expect(brasiliaToday(new Date("2026-12-20T03:00:00Z"))).toBe("2026-12-20");
  });

  it("REQ-STDAY-008 soma dias a uma data de calendário", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
