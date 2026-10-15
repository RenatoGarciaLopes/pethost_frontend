import { expect, it } from "vitest";
import { approveSchema, rejectSchema, fraudSchema, queueSearchSchema } from "./reviewSchemas";

it("REQ-AQUEUE-002 normaliza filtros desconhecidos e páginas inválidas", () => {
  expect(queueSearchSchema.parse({ status: "alien", page: "-1" })).toEqual({ status: "submitted", page: 1 });
  expect(queueSearchSchema.parse({ status: "approved", page: "2" })).toEqual({ status: "approved", page: 2 });
});
it("REQ-AQUEUE-009 valida motivo aparado entre 1 e 500 caracteres", () => {
  expect(approveSchema.parse({ reason: " conferido " })).toEqual({ reason: "conferido" });
  for (const reason of [" ", "a".repeat(501)]) expect(approveSchema.safeParse({ reason }).success).toBe(false);
  expect(approveSchema.safeParse({ reason: "a".repeat(500) }).success).toBe(true);
});
it("REQ-AQUEUE-010/011 separa fraude da recusa comum e exige confirmação", () => {
  expect(rejectSchema.safeParse({ rejectionReason: "suspected_fraud", reason: "nota" }).success).toBe(false);
  expect(rejectSchema.safeParse({ rejectionReason: "other", reason: "nota" }).success).toBe(true);
  expect(fraudSchema.safeParse({ reason: "nota", confirmed: false }).success).toBe(false);
  expect(fraudSchema.safeParse({ reason: "nota", confirmed: true }).success).toBe(true);
});
