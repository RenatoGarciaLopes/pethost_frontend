import { describe, expect, it } from "vitest";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import { checkInWindow, isCheckInWindow } from "./stayMilestones";

describe("isCheckInWindow", () => {
  it("REQ-STDAY-008 do dia da chegada até a véspera da saída", () => {
    expect(isCheckInWindow("2026-12-20", "2026-12-25", "2026-12-19")).toBe(false);
    expect(isCheckInWindow("2026-12-20", "2026-12-25", "2026-12-20")).toBe(true);
    expect(isCheckInWindow("2026-12-20", "2026-12-25", "2026-12-24")).toBe(true);
    expect(isCheckInWindow("2026-12-20", "2026-12-25", "2026-12-25")).toBe(false);
  });

  it("REQ-STDAY-008 às 23h do dia 19 em Brasília ainda é dia 19 (antes da chegada no dia 20)", () => {
    const today = brasiliaToday(new Date("2026-12-20T02:00:00Z"));
    expect(isCheckInWindow("2026-12-20", "2026-12-25", today)).toBe(false);
    expect(isCheckInWindow("2026-12-20", "2026-12-25", brasiliaToday(new Date("2026-12-20T03:00:00Z")))).toBe(true);
  });

  it("REQ-STDAY-001 diz se é cedo, a hora ou se o período passou", () => {
    expect(checkInWindow("2026-12-20", "2026-12-25", "2026-12-18")).toBe("early");
    expect(checkInWindow("2026-12-20", "2026-12-25", "2026-12-21")).toBe("open");
    expect(checkInWindow("2026-12-20", "2026-12-25", "2026-12-26")).toBe("closed");
  });
});
