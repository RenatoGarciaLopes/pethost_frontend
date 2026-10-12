import { describe, expect, it } from "vitest";
import { registrationSteps, stepIndexOf } from "./registrationSteps";

const steps = registrationSteps(["fullName", "email", "cpf"]);

describe("registrationSteps", () => {
  it("REQ-OREG-002 REQ-HREG-001 dois passos: você e onde você mora", () => {
    expect(steps.map((step) => step.label)).toEqual(["Você", "Onde você mora"]);
    expect(steps.map((step) => step.title)).toEqual(["Primeiro, você", "Onde você mora"]);
  });

  it("REQ-HREG-001 o passo 1 tem os campos de pessoa da variante; o endereço é igual", () => {
    expect(steps[0].fields).toEqual(["fullName", "email", "cpf"]);
    expect(registrationSteps(["fullName"])[1].fields).toEqual(steps[1].fields);
    expect(steps[1].fields).toEqual([
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
    expect(stepIndexOf(steps, ["email"])).toBe(0);
    expect(stepIndexOf(steps, ["address.zipCode"])).toBe(1);
    expect(stepIndexOf(steps, ["address.city", "cpf"])).toBe(0);
    expect(stepIndexOf(steps, ["desconhecido"])).toBeUndefined();
    expect(stepIndexOf(steps, [])).toBeUndefined();
  });

  it("REQ-HREG-006 campo fora dos passos da variante (CPF no anfitrião) não acha passo", () => {
    expect(stepIndexOf(registrationSteps(["fullName", "email"]), ["cpf"])).toBeUndefined();
  });
});
