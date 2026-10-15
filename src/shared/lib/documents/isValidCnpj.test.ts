import { expect, it } from "vitest";
import { isValidCnpj } from "./isValidCnpj";

it.each(["11.222.333/0001-81", "11222333000181", "12.ABC.345/01DE-35", "12abc34501de35"])(
  "REQ-HVER-004 aceita CNPJ válido, numérico ou alfanumérico, com ou sem máscara (%s)",
  (value) => {
    expect(isValidCnpj(value)).toBe(true);
  },
);

it.each([
  ["dígito errado", "11.222.333/0001-82"],
  ["curto", "11.222.333/0001"],
  ["tudo igual", "00.000.000/0000-00"],
  ["letra nos verificadores", "12.ABC.345/01DE-3A"],
  ["caractere estranho", "11.222.333/0001-8!"],
  ["vazio", ""],
])("REQ-HVER-004 recusa CNPJ %s", (_, value) => {
  expect(isValidCnpj(value)).toBe(false);
});
