import { describe, expect, it } from "vitest";
import { formatDeadline, formatMoment, formatPeriod, formatStayDay, isDeadlineNear } from "./formatStay";

describe("formatPeriod", () => {
  it("REQ-HREQ-002 período curto, no mesmo mês ou atravessando meses e anos", () => {
    expect(formatPeriod("2026-12-20", "2026-12-25")).toBe("20 a 25 de dez.");
    expect(formatPeriod("2026-11-30", "2026-12-02")).toBe("30 de nov. a 2 de dez.");
    expect(formatPeriod("2026-12-30", "2027-01-02")).toBe("30 de dez. de 2026 a 2 de jan. de 2027");
  });
});

describe("formatDeadline", () => {
  const now = new Date("2026-12-10T15:00:00Z"); // 12h em Brasília

  it("REQ-HREQ-002 prazo em Brasília: hoje, amanhã ou o dia", () => {
    expect(formatDeadline("2026-12-10T21:30:00Z", now)).toBe("hoje às 18h30");
    expect(formatDeadline("2026-12-11T12:00:00Z", now)).toBe("amanhã às 9h");
    expect(formatDeadline("2026-12-13T02:00:00Z", now)).toBe("sábado, 12/12, às 23h");
  });
});

describe("isDeadlineNear", () => {
  const now = new Date("2026-12-10T12:00:00Z");

  it("REQ-HREQ-002 destaca quando faltam menos de 3 horas (e o prazo não passou)", () => {
    expect(isDeadlineNear("2026-12-10T14:59:00Z", now)).toBe(true);
    expect(isDeadlineNear("2026-12-10T15:00:00Z", now)).toBe(false);
    expect(isDeadlineNear("2026-12-10T11:59:00Z", now)).toBe(false);
    expect(isDeadlineNear(null, now)).toBe(false);
  });
});

describe("formatStayDay e formatMoment", () => {
  it("REQ-STAYS-011 o dia com a semana e o momento curto em Brasília", () => {
    expect(formatStayDay("2026-12-20")).toBe("dom., 20 de dez.");
    expect(formatMoment("2026-12-10T17:30:00Z")).toBe("10 de dez., 14h30");
    expect(formatMoment("2026-12-10T12:00:00Z")).toBe("10 de dez., 9h");
  });
});
