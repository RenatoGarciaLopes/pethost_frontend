import { expect, it } from "vitest";
import { adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { adminOwnerSchema } from "./contracts";
it("REQ-AACC-002/004 tutor aceita CPF liberado e dados da conta omitidos", () => {
  expect(adminOwnerFixture({ cpf: null, user: undefined }).cpf).toBeNull();
  expect(
    adminOwnerSchema.safeParse({ ...adminOwnerFixture(), user: { ...adminOwnerFixture().user, role: "admin" } })
      .success,
  ).toBe(false);
});
