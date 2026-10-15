import { describe, expect, it } from "vitest";
import { addDays, brasiliaToday, nightsBetween, validateStay } from "./stayRules";

describe("REQ-SRCH-003 estadia", () => {
  it("usa o dia em Brasília, inclusive antes da meia-noite local", () => {
    expect(brasiliaToday(new Date("2026-10-15T02:59:59Z"))).toBe("2026-10-14");
    expect(brasiliaToday(new Date("2026-10-15T03:00:00Z"))).toBe("2026-10-15");
  });
  it("conta noites de calendário, viradas de ano e ano bissexto", () => {
    expect(nightsBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(nightsBetween("2026-10-15", "2026-11-14")).toBe(30);
  });
  it("aceita chegada hoje ou em 365 dias e até 30 noites", () => {
    expect(validateStay("2026-10-15", "2026-11-14", "2026-10-15")).toEqual({});
    expect(validateStay("2027-10-15", "2027-10-16", "2026-10-15")).toEqual({});
    expect(validateStay("", "", "2026-10-15")).toEqual({});
  });
  it.each([
    ["2026-10-14", "2026-10-16", "checkIn"],
    ["2027-10-16", "2027-10-17", "checkIn"],
    ["2026-10-15", "2026-10-15", "checkOut"],
    ["2026-10-15", "2026-11-15", "checkOut"],
    ["2026-02-30", "2026-10-16", "checkIn"],
    ["", "2026-10-16", "checkIn"],
    ["2026-10-15", "", "checkOut"],
  ])("rejeita %s / %s no campo %s", (from, to, field) => {
    expect(validateStay(from, to, "2026-10-15")).toHaveProperty(field);
  });
});
