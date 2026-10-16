import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { GetApiV1AuditEntriesResponse } from "@/shared/api/generated/audit-entries/audit-entries.zod";

const generatedPageSchema = unwrapData(GetApiV1AuditEntriesResponse);
const generatedEntrySchema = generatedPageSchema.shape.items.element;

/** DTO alinhado ao OpenAPI: detalhes são texto e ids de ator/alvo podem faltar.
 * @example auditEntrySchema.parse(dto)
 */
export const auditEntrySchema = generatedEntrySchema.extend({
  targetId: z.string().uuid().nullish(),
  actorId: z.string().uuid().nullish(),
  actorRole: z.string().nullish(),
  details: z.record(z.string(), z.string()),
});

/** Página da resposta auditada, sem o envelope comum da API.
 * @example auditPageSchema.parse(data)
 */
export const auditPageSchema = generatedPageSchema.extend({
  items: z.array(auditEntrySchema),
  totalPages: z.number().int().optional(),
});

/** DTO validado pelo OpenAPI atual. @example const dto: AuditEntryDto = auditEntrySchema.parse(value) */
export type AuditEntryDto = z.output<typeof auditEntrySchema>;
/** Modelo de leitura da tela, com instante pronto para formatar. @example const entry: AuditEntry = toAuditEntry(dto) */
export type AuditEntry = Omit<AuditEntryDto, "occurredAt"> & { occurredAt: Date };
/** Resultado da paginação do backend. @example const page: AuditPage = toAuditPage(dto) */
export type AuditPageDto = z.output<typeof auditPageSchema>;
/** Página projetada para a interface. @example const page: AuditPage = toAuditPage(dto) */
export type AuditPage = Omit<AuditPageDto, "items"> & { items: AuditEntry[] };
