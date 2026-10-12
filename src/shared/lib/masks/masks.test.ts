import { expect, it } from "vitest";
import { maskCpf, maskCnpj, maskCep, maskPhone, unmaskCpf, unmaskCnpj, unmaskCep, unmaskPhone } from "./masks";

it.each([
  [maskCpf, unmaskCpf, "12345678901", "123.456.789-01"],
  [maskCnpj, unmaskCnpj, "12345678000190", "12.345.678/0001-90"],
  [maskCep, unmaskCep, "12345678", "12345-678"],
  [maskPhone, unmaskPhone, "11987654321", "(11) 98765-4321"],
  [maskPhone, unmaskPhone, "1134567890", "(11) 3456-7890"],
])("REQ-DS-014 máscara e desmáscara são idempotentes (%s)", (mask, unmask, digits, formatted) => {
  expect(mask(digits)).toBe(formatted);
  expect(mask(formatted)).toBe(formatted);
  expect(unmask(formatted)).toBe(digits);
  expect(unmask(digits)).toBe(digits);
});
it("REQ-DS-014 máscaras aceitam vazio, parcial e descartam caracteres inválidos/excedentes", () => {
  for (const mask of [maskCpf, maskCnpj, maskCep, maskPhone]) expect(mask("abc")).toBe("");
  expect(maskCpf("1234")).toBe("123.4");
  expect(maskCnpj("123")).toBe("12.3");
  expect(maskCep("123456")).toBe("12345-6");
  expect(maskPhone("1")).toBe("(1");
  expect(maskPhone("11")).toBe("(11)");
  expect(maskPhone("119")).toBe("(11) 9");
  expect(maskPhone("113456")).toBe("(11) 3456");
  expect(maskCpf("123a45678901234")).toBe("123.456.789-01");
  expect(unmaskCep("12345-678999")).toBe("12345678");
});
