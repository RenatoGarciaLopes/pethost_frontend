import { expect, it } from "vitest";
import { accountProfileFixture } from "@/test/fixtures/account";
import { profileFormSchema, toProfileFormValues } from "./profileFormSchema";
it("REQ-ACC-004 reaproveita normalização de nome, UF e complemento da 011", () => {
  const values = toProfileFormValues(accountProfileFixture);
  const result = profileFormSchema.parse({
    ...values,
    fullName: "  Camila Souza  ",
    address: { ...values.address, state: " sp ", complement: " " },
  });
  expect(result.fullName).toBe("Camila Souza");
  expect(result.address.state).toBe("SP");
  expect(result.address.complement).toBe("");
  expect(values.birthDate).toBe("03051990");
  expect(values.currentPassword).toBe("");
});
it.each([
  { fullName: "" },
  { phone: "123" },
  { birthDate: "31042000" },
  { birthDate: "01012020" },
  { cpf: "11111111111" },
])("REQ-ACC-004 recusa dados inválidos %j", (patch) => {
  expect(profileFormSchema.safeParse({ ...toProfileFormValues(accountProfileFixture), ...patch }).success).toBe(false);
});
it("REQ-ACC-009/011 converte campos nulos sem inventar identidade ou senha", () => {
  const values = toProfileFormValues({
    ...accountProfileFixture,
    cpf: null,
    birthDate: null,
    address: null,
    company: null,
  });
  expect(values).toMatchObject({ cpf: "", birthDate: "", currentPassword: "", cnpj: "", tradeName: "" });
  expect(values.address.street).toBe("");
  expect(values.companyAddress).toBeUndefined();
});
it("REQ-ACC-009 endereço de empresa usa as mesmas regras e nome fantasia é aparado", () => {
  const values = toProfileFormValues({
    ...accountProfileFixture,
    role: "host",
    company: {
      cnpj: "11222333000181",
      legalName: "Empresa de Teste",
      tradeName: "Cantinho",
      address: accountProfileFixture.address!,
    },
  });
  expect(profileFormSchema.parse({ ...values, tradeName: "  Cantinho  " }).tradeName).toBe("Cantinho");
  expect(
    profileFormSchema.safeParse({ ...values, companyAddress: { ...values.companyAddress, state: "XX" } }).success,
  ).toBe(false);
});
