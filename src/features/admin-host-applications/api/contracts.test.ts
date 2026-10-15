import { expect, it } from "vitest";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { adminApplicationSchema, signedDocumentSchema } from "./contracts";
it("REQ-AQUEUE-005 contrato aceita CIN e recusa status ou tipo desconhecido", () => {
  const app = adminApplicationFixture({ documentType: "cin" });
  expect(app.documentType).toBe("cin");
  expect(adminApplicationSchema.safeParse({ ...app, status: "inventado" }).success).toBe(false);
  expect(adminApplicationSchema.safeParse({ ...app, personType: "inventado" }).success).toBe(false);
});
it("REQ-AQUEUE-006 contrato exige vaga conhecida, URL válida e vencimento Unix inteiro", () => {
  expect(signedDocumentSchema.safeParse({ kind: "front", url: "inválida", expiresAt: 100 }).success).toBe(false);
  expect(
    signedDocumentSchema.safeParse({ kind: "other", url: "https://private.test/photo", expiresAt: 100 }).success,
  ).toBe(false);
  expect(
    signedDocumentSchema.safeParse({ kind: "front", url: "https://private.test/photo", expiresAt: 1.5 }).success,
  ).toBe(false);
});
