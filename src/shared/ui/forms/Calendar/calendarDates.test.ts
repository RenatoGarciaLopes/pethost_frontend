import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildMonth,
  dayLabel,
  formatDisplayDate,
  isIsoDate,
  monthOf,
  monthsBetween,
  monthTitle,
  pickInRange,
  rangeSummary,
  shiftMonths,
  shortDate,
  weekdayOf,
} from "./calendarDates";

describe("calendarDates (REQ-CAL-001 mês e grade)", () => {
  it("monta as semanas começando no domingo, com null nos dias de fora", () => {
    const weeks = buildMonth({ year: 2026, month: 10 });
    expect(weeks[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(weeks.at(-1)!.at(-1)).toBe("2026-10-31");
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("fevereiro bissexto tem 29 dias e fevereiro comum 28", () => {
    expect(buildMonth({ year: 2024, month: 2 }).flat().filter(Boolean)).toHaveLength(29);
    expect(buildMonth({ year: 2026, month: 2 }).flat().filter(Boolean)).toHaveLength(28);
  });

  it("soma meses atravessando o ano e mede a distância", () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(monthsBetween({ year: 2026, month: 10 }, { year: 2027, month: 2 })).toBe(4);
    expect(monthOf("2026-12-25")).toEqual({ year: 2026, month: 12 });
  });

  it("shiftMonths preserva o dia e cai no último dia do mês curto", () => {
    expect(shiftMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftMonths("2026-03-15", -1)).toBe("2026-02-15");
    expect(shiftMonths("2026-12-10", 12)).toBe("2027-12-10");
  });

  it("valida ISO que existe", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("26-02-03")).toBe(false);
    expect(isIsoDate("2026-12-25")).toBe(true);
    expect(weekdayOf("2026-12-25")).toBe(5);
  });
});

describe("calendarDates (REQ-CAL-002 textos em pt-BR)", () => {
  it("título do mês, rótulo por extenso e data do campo", () => {
    expect(monthTitle({ year: 2026, month: 10 })).toBe("outubro de 2026");
    expect(dayLabel("2026-12-25")).toBe("sexta-feira, 25 de dezembro de 2026");
    expect(formatDisplayDate("2026-12-25")).toBe("25/12/2026");
    expect(formatDisplayDate("")).toBe("");
    expect(shortDate("2026-12-25")).toBe("25 dez");
  });

  it("resumo do intervalo no mesmo mês e entre meses, com singular", () => {
    expect(rangeSummary("2026-12-20", "2026-12-25")).toBe("5 noites · 20 a 25 dez");
    expect(rangeSummary("2026-12-28", "2027-01-02")).toBe("5 noites · 28 dez a 2 jan");
    expect(rangeSummary("2026-12-20", "2026-12-21")).toBe("1 noite · 20 a 21 dez");
  });
});

describe("pickInRange (REQ-CAL-003 seleção de intervalo)", () => {
  const none = { start: "", end: "" };
  it("o primeiro toque escolhe a chegada", () => {
    expect(pickInRange(none, "2026-12-20", false)).toEqual({
      range: { start: "2026-12-20", end: "" },
      complete: false,
    });
  });
  it("com a chegada, um dia depois vira saída e completa", () => {
    expect(pickInRange({ start: "2026-12-20", end: "" }, "2026-12-25", false)).toEqual({
      range: { start: "2026-12-20", end: "2026-12-25" },
      complete: true,
    });
  });
  it("com a chegada, o mesmo dia ou um dia antes recomeça pela chegada", () => {
    expect(pickInRange({ start: "2026-12-20", end: "" }, "2026-12-20", false).range).toEqual({
      start: "2026-12-20",
      end: "",
    });
    expect(pickInRange({ start: "2026-12-20", end: "" }, "2026-12-18", false).range).toEqual({
      start: "2026-12-18",
      end: "",
    });
  });
  it("intervalo completo recomeça, exceto quando se edita a saída", () => {
    const full = { start: "2026-12-20", end: "2026-12-25" };
    expect(pickInRange(full, "2026-12-28", false)).toEqual({
      range: { start: "2026-12-28", end: "" },
      complete: false,
    });
    expect(pickInRange(full, "2026-12-28", true)).toEqual({
      range: { start: "2026-12-20", end: "2026-12-28" },
      complete: true,
    });
  });
});
