import { expect, it } from "vitest";
import { accountProfileFixture } from "@/test/fixtures/account";
import { gatewayFor, ownerProfileGateway } from "./profileGateway";
it("REQ-ACC-004 seleciona o adaptador de tutor já disponível", () => {
  expect(gatewayFor("owner")).toBe(ownerProfileGateway);
});
it("REQ-ACC-003/004 tutor tem campos livres, e-mail travado e empresa oculta", () => {
  const fields = ownerProfileGateway.editability(accountProfileFixture);
  for (const field of ["fullName", "phone", "address", "cpf", "birthDate", "avatarUrl"] as const)
    expect(fields[field].mode).toBe("free");
  expect(fields.email).toEqual({ mode: "locked", reason: "O e-mail é o seu login e não muda por aqui." });
  for (const field of ["cnpj", "legalName", "tradeName", "companyAddress"] as const)
    expect(fields[field].mode).toBe("hidden");
});
