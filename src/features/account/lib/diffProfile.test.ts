import { expect, it } from "vitest";
import { accountProfileFixture } from "@/test/fixtures/account";
import { toProfileFormValues } from "../schemas/profileFormSchema";
import { diffProfile, needsCurrentPassword } from "./diffProfile";
it("REQ-ACC-006 não envia nada quando nada mudou, mesmo com senha preenchida", () => {
  const initial = toProfileFormValues(accountProfileFixture);
  expect(diffProfile(initial, { ...initial, currentPassword: "não enviar" })).toEqual({});
  expect(needsCurrentPassword(initial, initial)).toBe(false);
});
it("REQ-ACC-006 manda só telefone e ignora e-mail travado", () => {
  const initial = toProfileFormValues(accountProfileFixture);
  expect(diffProfile(initial, { ...initial, phone: "11999999999", email: "outro@exemplo.test" })).toEqual({
    phone: "11999999999",
  });
});
it("REQ-ACC-006 manda endereço inteiro quando qualquer parte muda e limpa complemento com vazio", () => {
  const initial = toProfileFormValues(accountProfileFixture);
  const address = { ...initial.address, complement: "" };
  expect(diffProfile(initial, { ...initial, address })).toEqual({ address });
});
it("REQ-ACC-005 CPF e nascimento são normalizados e levam a senha atual", () => {
  const initial = toProfileFormValues(accountProfileFixture);
  const values = { ...initial, cpf: "168.995.350-09", birthDate: "04/05/1990", currentPassword: "  antiga  " };
  expect(needsCurrentPassword(initial, values)).toBe(true);
  expect(diffProfile(initial, values)).toEqual({
    cpf: "16899535009",
    birthDate: "1990-05-04",
    currentPassword: "  antiga  ",
  });
  expect(needsCurrentPassword(initial, { ...initial, cpf: "529.982.247-25", birthDate: "03/05/1990" })).toBe(false);
});
it("REQ-ACC-009 envia nome fantasia e endereço da empresa completos", () => {
  const initial = toProfileFormValues({
    ...accountProfileFixture,
    company: {
      cnpj: "11222333000181",
      legalName: "Empresa",
      tradeName: "Cantinho",
      address: accountProfileFixture.address!,
    },
  });
  const companyAddress = { ...initial.companyAddress!, street: "Outra rua" };
  expect(diffProfile(initial, { ...initial, tradeName: "Nome novo", companyAddress })).toEqual({
    tradeName: "Nome novo",
    companyAddress,
  });
});
