import { auditEntrySchema, auditPageSchema, toAuditPage } from "@/features/admin-audit";
import type { AuditEntryDto, AuditPage, AuditPageDto } from "@/features/admin-audit";

/** Registro sintético sem dado pessoal real para auditoria em teste/story.
 * @example auditEntryFixture({ action: "owner.suspended" })
 */
export function auditEntryFixture(overrides: Partial<AuditEntryDto> = {}): AuditEntryDto {
  return auditEntrySchema.parse({
    id: "77b9c00c-fdc0-4422-b4c7-7e237741a4a7",
    occurredAt: "2026-10-09T12:00:00Z",
    action: "owner.suspended",
    targetType: "owner",
    targetId: "15d2c8a8-8f67-44f7-8eb3-4ecf56c65e83",
    actorId: "9f19b59c-2c65-40a4-9e72-371ae9fdcd6e",
    actorRole: "admin",
    reason: "Dados conferidos em teste",
    details: { status: "suspended" },
    ipAddress: "203.0.113.17",
    traceId: "trace-sintetico-033",
    ...overrides,
  });
}

/** Página sintética de uma busca, sem fazer requisições.
 * @example auditPageFixture([auditEntryFixture()])
 */
export function auditPageFixture(items: AuditEntryDto[] = [auditEntryFixture()]): AuditPageDto {
  return auditPageSchema.parse({ items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1 });
}

/** Página de cache com instantes convertidos, para composições visuais.
 * @example auditPageModelFixture().items[0]?.occurredAt instanceof Date
 */
export function auditPageModelFixture(items: AuditEntryDto[] = [auditEntryFixture()]): AuditPage {
  return toAuditPage(auditPageFixture(items));
}
