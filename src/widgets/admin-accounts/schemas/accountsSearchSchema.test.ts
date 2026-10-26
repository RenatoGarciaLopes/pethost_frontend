import { expect, it } from "vitest";
import { accountsSearchSchema } from "./accountsSearchSchema";
it("REQ-AACC-001/003/014 filtros desconhecidos voltam ao padrão sem levar busca pessoal à URL", () => {
  expect(
    accountsSearchSchema.parse({
      type: "wrong",
      status: "wrong",
      page: "0",
      stripeStatus: "wrong",
      search: "52998224725",
    }),
  ).toEqual({ type: "owners", status: "all", page: 1, stripeStatus: "all" });
  expect(accountsSearchSchema.parse({ type: "hosts", stripeStatus: "rejected", page: "2" }).stripeStatus).toBe(
    "rejected",
  );
});
