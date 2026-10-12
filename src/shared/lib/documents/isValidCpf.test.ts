import { describe, expect, it } from "vitest";
import { isValidCpf } from "./isValidCpf";

describe("isValidCpf", () => {
  it.each(["52998224725", "529.982.247-25", "111.444.777-35", "390.533.447-05"])(
    "REQ-OREG-003 aceita CPF válido com e sem máscara (%s)",
    (cpf) => expect(isValidCpf(cpf)).toBe(true),
  );

  it.each([
    ["dígito verificador errado", "529.982.247-24"],
    ["segundo dígito errado", "52998224735"],
    ["todos iguais", "111.111.111-11"],
    ["zeros", "00000000000"],
    ["curto", "5299822472"],
    ["longo", "529982247250"],
    ["vazio", ""],
    ["com letra", "52998224a25"],
  ])("REQ-OREG-003 recusa %s", (_case, cpf) => expect(isValidCpf(cpf)).toBe(false));
});
