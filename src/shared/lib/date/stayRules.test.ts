import { describe, expect, it } from "vitest";
import {
  addDays,
  brasiliaToday,
  earliestRequestCheckIn,
  nightsBetween,
  validateRequestStay,
  validateStay,
} from "./stayRules";

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

describe("REQ-STDAY-008 relógio da estadia", () => {
  it("o dia de hoje é o de Brasília (UTC-3 fixo), não o do navegador", () => {
    // 23h do dia 19 em Brasília = 02h UTC do dia 20.
    expect(brasiliaToday(new Date("2026-12-20T02:00:00Z"))).toBe("2026-12-19");
    expect(brasiliaToday(new Date("2026-12-20T03:00:00Z"))).toBe("2026-12-20");
  });

  it("soma e subtrai dias a uma data de calendário; data inválida vira vazio", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-02-30", 1)).toBe("");
  });
});

describe("REQ-REQST-010 pedido com 72 h de antecedência", () => {
  it("a primeira chegada possível é hoje + 4 dias (meia-noite do dia da chegada a 72 h ou mais)", () => {
    expect(earliestRequestCheckIn("2026-12-10")).toBe("2026-12-14");
    expect(earliestRequestCheckIn("2026-12-30")).toBe("2027-01-03");
  });

  it("chegada antes disso leva a frase em pt-BR; a busca (validateStay) continua aceitando", () => {
    expect(validateRequestStay("2026-12-13", "2026-12-15", "2026-12-10").checkIn).toBe(
      "A chegada precisa ser daqui a pelo menos 3 dias: o anfitrião tem 24 horas pra responder.",
    );
    expect(validateRequestStay("2026-12-14", "2026-12-15", "2026-12-10")).toEqual({});
    expect(validateStay("2026-12-11", "2026-12-12", "2026-12-10")).toEqual({});
  });

  it("o pedido exige as duas datas", () => {
    expect(validateRequestStay("", "", "2026-12-10")).toMatchObject({
      checkIn: "Escolhe uma data de chegada válida.",
      checkOut: "Escolhe uma data de saída válida.",
    });
  });
});
