import type { AuditSearch } from "../schemas/auditSearchSchema";

/** Parâmetros aceitos no GET /audit-entries.
 * @example const query: AuditQuery = { page: 1, pageSize: 20 }
 */
export interface AuditQuery {
  page: number;
  pageSize: number;
  action?: string;
  targetType?: string;
  targetId?: string;
  actorId?: string;
  from?: string;
  to?: string;
}

/** Converte datas locais inclusivas para o contrato ISO 8601 com offset da API.
 * @example toAuditQuery({ page: 1, pageSize: 20, from: "2026-10-15" }).from // "2026-10-15T00:00:00.000-03:00"
 */
export function toAuditQuery(filters: AuditSearch, fixed?: Pick<AuditSearch, "targetType" | "targetId">): AuditQuery {
  if (filters.from && filters.to && filters.from > filters.to) throw new RangeError("from must not be after to");
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    action: filters.action,
    targetType: fixed?.targetType ?? filters.targetType,
    targetId: fixed?.targetId ?? filters.targetId,
    actorId: filters.actorId,
    from: filters.from ? `${filters.from}T00:00:00.000-03:00` : undefined,
    to: filters.to ? `${filters.to}T23:59:59.999-03:00` : undefined,
  };
}
