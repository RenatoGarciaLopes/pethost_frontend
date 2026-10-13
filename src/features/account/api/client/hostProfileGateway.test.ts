import { expect, it } from "vitest";
import { accountProfileFixture } from "@/test/fixtures/account";
import { gatewayFor, hostProfileGateway } from "./profileGateway";
it("REQ-ACC-009 seleciona o adaptador de anfitrião já disponível", () => {
  expect(gatewayFor("host")).toBe(hostProfileGateway);
});
it.each([false, true])("REQ-ACC-009 identidade travada de anfitrião com empresa=%s", (company) => {
  const fields = hostProfileGateway.editability({
    ...accountProfileFixture,
    role: "host",
    company: company
      ? { cnpj: "11222333000181", legalName: "Empresa", tradeName: "Cantinho", address: accountProfileFixture.address! }
      : null,
  });
  for (const field of ["fullName", "birthDate", "cpf"] as const)
    expect(fields[field]).toEqual({
      mode: "locked",
      reason: "Esses dados foram conferidos na verificação. Pra mudar, fala com o suporte.",
    });
  expect(fields.phone.mode).toBe("free");
  expect(fields.address.mode).toBe("free");
  expect(fields.cnpj.mode).toBe(company ? "locked" : "hidden");
  expect(fields.legalName.mode).toBe(company ? "locked" : "hidden");
  expect(fields.tradeName.mode).toBe(company ? "free" : "hidden");
  expect(fields.companyAddress.mode).toBe(company ? "free" : "hidden");
});
it("REQ-ACC-011 conta não aprovada trava tudo e esconde envio de foto", () => {
  const fields = hostProfileGateway.editability({ ...accountProfileFixture, role: "host", verified: false });
  for (const field of ["fullName", "phone", "address", "birthDate", "cpf"] as const)
    expect(fields[field]).toEqual({ mode: "locked", reason: "Seus dados ficam editáveis depois da verificação." });
  expect(fields.email.mode).toBe("locked");
  expect(fields.avatarUrl.mode).toBe("hidden");
});
