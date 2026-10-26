import type { AuditEntry, AuditEntryDto, AuditPage, AuditPageDto } from "./contracts";

/** Converte o instante validado do DTO para uso pela interface.
 * @example toAuditEntry(auditEntrySchema.parse(dto))
 */
export function toAuditEntry(dto: AuditEntryDto): AuditEntry {
  return { ...dto, occurredAt: new Date(dto.occurredAt) };
}

/** Mantém paginação da API e projeta os registros sem alterar ordem ou campos sensíveis.
 * @example toAuditPage(auditPageSchema.parse(response.data))
 */
export function toAuditPage(dto: AuditPageDto): AuditPage {
  return { ...dto, items: dto.items.map(toAuditEntry) };
}
