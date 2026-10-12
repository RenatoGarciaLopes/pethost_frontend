import { describe, expect, it } from "vitest";
import {
  ownerRegistrationSchema,
  type HostRegistrationValues,
  type OwnerRegistrationValues,
} from "../../schemas/registrationSchemas";
import { toHostRegisterBody, toOwnerRegisterBody } from "./toRegisterBody";

const hostValues: HostRegistrationValues = {
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "05031990",
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

const values: OwnerRegistrationValues = { ...hostValues, cpf: "52998224725" };

const hostBody = {
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "1990-03-05",
  address: {
    zipCode: "87020000",
    street: "Rua das Flores",
    number: "120",
    neighborhood: "Centro",
    city: "Maringá",
    state: "PR",
  },
};

describe("toOwnerRegisterBody", () => {
  it("REQ-OREG-008 nascimento vira yyyy-MM-dd e documentos vão só com dígitos", () => {
    expect(toOwnerRegisterBody(values)).toEqual({ ...hostBody, cpf: "52998224725" });
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

describe("toHostRegisterBody", () => {
  it("REQ-HREG-004 mesmas normalizações do tutor, sem cpf e sem role", () => {
    const body = toHostRegisterBody(hostValues);
    expect(body).toEqual(hostBody);
    expect(body).not.toHaveProperty("cpf");
    expect(body).not.toHaveProperty("role");
  });

  it("REQ-HREG-004 não leva o CPF mesmo se o valor vier junto", () => {
    expect(toHostRegisterBody(values)).toEqual(hostBody);
  });

  it("REQ-HREG-004 complemento preenchido vai; vazio não vai", () => {
    const body = toHostRegisterBody({ ...hostValues, address: { ...hostValues.address, complement: "Casa 2" } });
    expect(body.address).toMatchObject({ complement: "Casa 2" });
  });

  it("REQ-OREG-008 o corpo do tutor é o do anfitrião mais o CPF", () => {
    expect(toOwnerRegisterBody(values)).toEqual({ ...toHostRegisterBody(hostValues), cpf: values.cpf });
  });

  it("recusa nascimento que não é data (uso sem passar pelo schema)", () => {
    expect(() => toHostRegisterBody({ ...hostValues, birthDate: "31021990" })).toThrow(/nascimento/);
  });
});
