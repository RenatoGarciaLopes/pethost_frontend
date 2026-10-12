import { describe, expect, it } from "vitest";
import { compareCalendarDates, isAdult, parseBrazilianDate, toIsoDate, todayCalendarDate } from "./brazilianDate";

const today = { year: 2026, month: 10, day: 12 };

describe("parseBrazilianDate", () => {
  it("REQ-OREG-003 lê com barras e só com dígitos", () => {
    expect(parseBrazilianDate("03/05/1990")).toEqual({ year: 1990, month: 5, day: 3 });
    expect(parseBrazilianDate("03051990")).toEqual({ year: 1990, month: 5, day: 3 });
  });

  it("REQ-OREG-003 29/02 só em ano bissexto", () => {
    expect(parseBrazilianDate("29/02/2024")).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseBrazilianDate("29/02/2023")).toBeNull();
  });

  it.each(["31/04/1990", "00/01/1990", "10/13/1990", "1/1/1990", "0305199", "", "ab/cd/efgh", "01/01/1899"])(
    "REQ-OREG-003 recusa data incompleta ou inexistente (%s)",
    (value) => expect(parseBrazilianDate(value)).toBeNull(),
  );
});

describe("isAdult", () => {
  it("REQ-OREG-003 18 anos completos hoje passa; um dia depois do nascimento ainda não", () => {
    expect(isAdult({ year: 2008, month: 10, day: 12 }, today)).toBe(true);
    expect(isAdult({ year: 2008, month: 10, day: 13 }, today)).toBe(false);
    expect(isAdult({ year: 1990, month: 1, day: 1 }, today)).toBe(true);
  });

  it("REQ-OREG-003 nascido em 29/02 faz 18 em 01/03 de ano não bissexto", () => {
    const birth = { year: 2008, month: 2, day: 29 };
    expect(isAdult(birth, { year: 2026, month: 2, day: 28 })).toBe(false);
    expect(isAdult(birth, { year: 2026, month: 3, day: 1 })).toBe(true);
    expect(isAdult({ year: 2006, month: 2, day: 29 }, { year: 2024, month: 2, day: 29 })).toBe(true);
  });

  it("REQ-OREG-003 aceita outra idade mínima", () => {
    expect(isAdult({ year: 2010, month: 1, day: 1 }, today, 16)).toBe(true);
  });
});

describe("toIsoDate, compareCalendarDates e todayCalendarDate", () => {
  it("REQ-OREG-008 formata yyyy-MM-dd com zeros", () => {
    expect(toIsoDate({ year: 1990, month: 5, day: 3 })).toBe("1990-05-03");
  });

  it("REQ-OREG-003 compara para achar data no futuro", () => {
    expect(compareCalendarDates({ year: 2026, month: 10, day: 13 }, today)).toBeGreaterThan(0);
    expect(compareCalendarDates(today, today)).toBe(0);
    expect(compareCalendarDates({ year: 2026, month: 9, day: 30 }, today)).toBeLessThan(0);
  });

  it("usa a data local do relógio", () => {
    expect(todayCalendarDate(new Date(2026, 9, 12, 23, 59))).toEqual(today);
  });
});
