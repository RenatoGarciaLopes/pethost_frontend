import { describe, expect, it } from "vitest";
import { REGISTRATION_FIELDS, REGISTRATION_STEPS, stepIndexOf } from "./registrationSteps";

describe("registrationSteps", () => {
  it("REQ-OREG-002 dois passos: você e onde você mora", () => {
    expect(REGISTRATION_STEPS.map((step) => step.label)).toEqual(["Você", "Onde você mora"]);
  });

  it("REQ-OREG-009 lista todos os campos na ordem da tela", () => {
    expect(REGISTRATION_FIELDS).toEqual([
      "fullName",
      "email",
      "password",
      "phone",
      "birthDate",
      "cpf",
      "address.zipCode",
      "address.street",
      "address.number",
      "address.complement",
      "address.neighborhood",
      "address.city",
      "address.state",
    ]);
  });

  it("REQ-OREG-009 acha o primeiro passo com erro", () => {
    expect(stepIndexOf(["email"])).toBe(0);
    expect(stepIndexOf(["address.zipCode"])).toBe(1);
    expect(stepIndexOf(["address.city", "cpf"])).toBe(0);
    expect(stepIndexOf(["desconhecido"])).toBeUndefined();
    expect(stepIndexOf([])).toBeUndefined();
  });
});
