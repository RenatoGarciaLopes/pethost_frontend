import { expect, it } from "vitest";
import { searchDateLabel } from "./searchDateLabel";

it("REQ-UIC-007 datas da faixa têm leitura humana sem perder o valor ISO", () => {
  expect(searchDateLabel("2026-12-20", "arrival")).toBe("20 dez, a partir das 14h");
  expect(searchDateLabel("2026-12-25", "departure", "2026-12-20")).toBe("25 dez · 5 noites");
  expect(searchDateLabel("2027-01-01", "departure", "2026-12-31")).toBe("1 jan · 1 noite");
});

it("REQ-UIC-007 datas vazias, inválidas e intervalo invertido não inventam noites", () => {
  expect(searchDateLabel("", "arrival")).toBe("Quando chega?");
  expect(searchDateLabel("2026-02-30", "departure")).toBe("Quando volta?");
  expect(searchDateLabel("2026-12-19", "departure", "2026-12-20")).toBe("19 dez");
  expect(searchDateLabel("2028-02-29", "departure", "2028-02-28")).toBe("29 fev · 1 noite");
});
