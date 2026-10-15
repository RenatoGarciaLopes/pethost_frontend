import { z } from "zod";

const actionSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/)
  .max(64);
const targetTypeSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]{0,31}$/);
const uuidSchema = z.string().uuid();
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  });
const pageInputSchema = z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const pageSizeInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? Number(value) : value),
  z.union([z.literal(20), z.literal(50), z.literal(100)]),
);
const pageSchema = pageInputSchema.catch(1);
const pageSizeSchema = pageSizeInputSchema.catch(20);

const searchFields = {
  action: actionSchema,
  targetType: targetTypeSchema,
  targetId: uuidSchema,
  actorId: uuidSchema,
  from: dateSchema,
  to: dateSchema,
  page: pageInputSchema,
  pageSize: pageSizeInputSchema,
} as const;

const auditSearchStateSchema = z.object({
  action: actionSchema.optional(),
  targetType: targetTypeSchema.optional(),
  targetId: uuidSchema.optional(),
  actorId: uuidSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  page: pageSchema,
  pageSize: pageSizeSchema,
});

/** Filtros canônicos do explorer, com defaults para paginação.
 * @example const filters: AuditSearch = { page: 1, pageSize: 20 }
 */
export type AuditSearch = z.infer<typeof auditSearchStateSchema>;
/** Nomes de filtro que podem ser sinalizados como inválidos.
 * @example const field: AuditSearchParam = "targetId"
 */
export type AuditSearchParam = keyof typeof searchFields;

/** Descarta cada parâmetro inválido de forma isolada e restaura página/tamanho seguros.
 * @example sanitizeAuditSearchParams({ page: "-1", action: "owner.suspended" }).filters.page // 1
 */
export function sanitizeAuditSearchParams(raw: unknown): { filters: AuditSearch; invalid: AuditSearchParam[] } {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const clean: Record<string, unknown> = {};
  const invalid: AuditSearchParam[] = [];

  for (const key of Object.keys(searchFields) as AuditSearchParam[]) {
    const value = source[key];
    if (value === undefined || value === "") continue;
    const parsed = searchFields[key].safeParse(value);
    if (parsed.success) clean[key] = parsed.data;
    else invalid.push(key);
  }

  return { filters: auditSearchStateSchema.parse(clean), invalid };
}

/** Schema tolerante para useSearchParamsState: a leitura nunca deixa valor inválido chegar à query.
 * @example auditSearchSchema.parse({ page: "2" }).page // 2
 */
export const auditSearchSchema: z.ZodType<AuditSearch, z.ZodTypeDef, unknown> = z.preprocess(
  (raw) => sanitizeAuditSearchParams(raw).filters,
  auditSearchStateSchema,
);

/** Período reverso fica visível no formulário e impede a chamada à API.
 * @example hasInvalidAuditDateRange({ ...filters, from: "2026-10-10", to: "2026-10-09" }) // true
 */
export function hasInvalidAuditDateRange(filters: Pick<AuditSearch, "from" | "to">): boolean {
  return Boolean(filters.from && filters.to && filters.from > filters.to);
}
