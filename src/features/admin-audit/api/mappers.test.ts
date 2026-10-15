import { describe, expect, it } from "vitest";
import { auditEntrySchema, auditPageSchema } from "./contracts";
import { toAuditEntry, toAuditPage } from "./mappers";

const entryDto = {
  id: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7",
  occurredAt: "2026-10-09T12:00:00Z",
  action: "owner.suspended",
  targetType: "owner",
  targetId: null,
  actorId: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e",
  actorRole: null,
  reason: "Dados conferidos",
  details: { fields: "cpf,birthDateChanged" },
  ipAddress: null,
  traceId: null,
};

describe("REQ-AUDIT-001 e REQ-AUDIT-006 contratos", () => {
  it("aceita IDs nulos e detalhes textuais e projeta a data", () => {
    const entry = toAuditEntry(auditEntrySchema.parse(entryDto));
    expect(entry.occurredAt).toEqual(new Date("2026-10-09T12:00:00Z"));
    expect(entry.targetId).toBeNull();
    expect(entry.details).toEqual({ fields: "cpf,birthDateChanged" });
  });

  it("rejeita detalhes que divergem do OpenAPI Record<string,string>", () => {
    expect(auditEntrySchema.safeParse({ ...entryDto, details: { count: 3 } }).success).toBe(false);
  });

  it("preserva totalCount e tolera totalPages ausente", () => {
    const page = toAuditPage(auditPageSchema.parse({ items: [entryDto], page: 1, pageSize: 20, totalCount: 1 }));
    expect(page).toMatchObject({ totalCount: 1, items: [{ id: entryDto.id }] });
    expect(page.totalPages).toBeUndefined();
  });
});
