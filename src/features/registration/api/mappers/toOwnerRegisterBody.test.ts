import { describe, expect, it } from "vitest";
import { ownerRegistrationSchema, type OwnerRegistrationValues } from "../../schemas/ownerRegistrationSchema";
import { toOwnerRegisterBody } from "./toOwnerRegisterBody";

const values: OwnerRegistrationValues = {
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "05031990",
  cpf: "52998224725",
  address: {
    zipCode: "87020000",
    street: "Rua das Flores",
    number: "120",
    complement: "",
    neighborhood: "Centro",
    city: "Maringá",
    state: "PR",
  },
};

describe("toOwnerRegisterBody", () => {
  it("REQ-OREG-008 nascimento vira yyyy-MM-dd e documentos vão só com dígitos", () => {
    expect(toOwnerRegisterBody(values)).toEqual({
      fullName: "Camila Souza",
      email: "camila@exemplo.com",
      password: "Senha#forte1",
      phone: "44999990000",
      birthDate: "1990-03-05",
      cpf: "52998224725",
      address: {
        zipCode: "87020000",
        street: "Rua das Flores",
        number: "120",
        neighborhood: "Centro",
        city: "Maringá",
        state: "PR",
      },
    });
  });

  it("REQ-OREG-008 complemento preenchido vai; vazio não vai", () => {
    const body = toOwnerRegisterBody({ ...values, address: { ...values.address, complement: "Apto 12" } });
    expect(body.address).toMatchObject({ complement: "Apto 12" });
    expect(toOwnerRegisterBody(values).address).not.toHaveProperty("complement");
  });

  it("REQ-OREG-008 textos chegam aparados pelo schema", () => {
    const parsed = ownerRegistrationSchema.parse({
      ...values,
      fullName: "  Camila  ",
      address: { ...values.address, street: "  Rua das Flores ", complement: "   " },
    });
    const body = toOwnerRegisterBody(parsed);
    expect(body.fullName).toBe("Camila");
    expect(body.address).toMatchObject({ street: "Rua das Flores" });
    expect(body.address).not.toHaveProperty("complement");
  });

  it("recusa nascimento que não é data (uso sem passar pelo schema)", () => {
    expect(() => toOwnerRegisterBody({ ...values, birthDate: "31021990" })).toThrow(/nascimento/);
  });
});
