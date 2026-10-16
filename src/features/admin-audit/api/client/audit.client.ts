import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { auditPageSchema } from "../contracts";
import type { AuditQuery } from "../../lib/toAuditQuery";
import { toAuditPage } from "../mappers";

/** Lista registros no BFF autenticado, usando apenas parâmetros do OpenAPI.
 * @example await listAuditEntries({ page: 1, pageSize: 20 })
 */
export async function listAuditEntries(query: AuditQuery, transport: HttpTransport = bffClient, signal?: AbortSignal) {
  const result = await transport.request(
    { method: "GET", path: "/audit-entries", query: { ...query }, signal },
    auditPageSchema,
  );
  return toAuditPage(result);
}
