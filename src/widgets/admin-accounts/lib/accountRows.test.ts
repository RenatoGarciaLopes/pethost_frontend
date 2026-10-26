import { expect, it } from "vitest";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { filterAccounts, toAccountRow } from "./accountRows";
it("REQ-AACC-002/008 estado prioriza liberação, suspensão e inatividade", () => {
  expect(
    toAccountRow({ kind: "owners", value: adminOwnerFixture({ cpf: null, suspendedAt: "2026-10-01T12:00:00Z" }) })
      .status,
  ).toBe("released");
  expect(
    toAccountRow({
      kind: "hosts",
      value: adminHostFixture({ identityReleasedAt: "2026-10-01T12:00:00Z", isActive: false }),
    }).status,
  ).toBe("released");
  expect(
    toAccountRow({ kind: "owners", value: adminOwnerFixture({ suspendedAt: "2026-10-01T12:00:00Z", isActive: false }) })
      .status,
  ).toBe("suspended");
  expect(toAccountRow({ kind: "owners", value: adminOwnerFixture({ isActive: false }) }).status).toBe("inactive");
});
it("REQ-AACC-003 busca aceita nome sem acento, e-mail e CPF com máscara sem procurar só pontuação", () => {
  const row = toAccountRow({ kind: "owners", value: adminOwnerFixture() });
  for (const search of ["JOAO", "joao@example", "529.982.247-25"])
    expect(filterAccounts([row], search, "all")).toEqual([row]);
  expect(filterAccounts([row], "outra pessoa", "all")).toEqual([]);
  expect(filterAccounts([row], "...", "all")).toEqual([]);
  expect(filterAccounts([row], "", "suspended")).toEqual([]);
});
it("REQ-AACC-002/014 empresa preserva nome fantasia, CNPJ e status de recebimento", () => {
  const row = toAccountRow({
    kind: "hosts",
    value: adminHostFixture({
      personType: "pj",
      company: { cnpj: "11222333000181", legalName: "Teste", tradeName: "Casa de teste", address: {} },
      stripeStatus: "rejected",
    }),
  });
  expect(row.tradeName).toBe("Casa de teste");
  expect(row.cnpj).toBe("11222333000181");
  expect(row.stripeStatus).toBe("rejected");
});
