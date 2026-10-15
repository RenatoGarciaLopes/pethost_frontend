import { describe, expect, it } from "vitest";
import { auditSearchSchema, hasInvalidAuditDateRange, sanitizeAuditSearchParams } from "./auditSearchSchema";

describe("REQ-AUDIT-002 filtros da URL", () => {
  it("mantém filtros válidos e padrões de paginação", () => {
    expect(auditSearchSchema.parse({ action: "owner.suspended", page: "2", pageSize: "50" })).toEqual({
      action: "owner.suspended",
      page: 2,
      pageSize: 50,
    });
  });

  it("descarta UUID, código, data, repetição e paginação inválidos sem perder os outros", () => {
    const result = sanitizeAuditSearchParams({
      action: "  owner.suspended  ",
      targetId: "não-é-uuid",
      actorId: ["id-a", "id-b"],
      from: "2026-02-30",
      page: "-1",
      pageSize: "25",
    });

    expect(result.filters).toEqual({ action: "owner.suspended", page: 1, pageSize: 20 });
    expect(result.invalid).toEqual(["targetId", "actorId", "from", "page", "pageSize"]);
  });

  it("aceita código de ação futuro e informa intervalo reverso separadamente", () => {
    const filters = auditSearchSchema.parse({ action: "new_module.changed", from: "2026-10-12", to: "2026-10-11" });
    expect(filters.action).toBe("new_module.changed");
    expect(hasInvalidAuditDateRange(filters)).toBe(true);
  });
});
