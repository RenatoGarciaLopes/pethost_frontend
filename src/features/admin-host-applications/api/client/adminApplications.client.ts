import { z } from "zod";
import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import {
  adminApplicationSchema,
  adminApplicationListSchema,
  signedDocumentSchema,
  commonRejectionSchema,
  type ApplicationStatus,
  type DocumentKind,
} from "../contracts";
import { approveSchema } from "../../schemas/reviewSchemas";
const pathOf = (id: string) => `/host-applications/${encodeURIComponent(id)}`;
const rejectionBody = approveSchema.extend({
  rejectionReason: z.enum([...commonRejectionSchema.options, "suspected_fraud"]),
});
/** Lista administrativa do status, sem paginação na API. @example await listApplications("submitted") */
export function listApplications(
  status: ApplicationStatus,
  transport: HttpTransport = bffClient,
  signal?: AbortSignal,
) {
  return transport.request(
    { method: "GET", path: "/host-applications", query: { status }, signal },
    adminApplicationListSchema,
  );
}
/** Detalhe privado administrativo. @example await getApplication(id) */
export function getApplication(id: string, transport: HttpTransport = bffClient, signal?: AbortSignal) {
  return transport.request({ method: "GET", path: pathOf(id), signal }, adminApplicationSchema);
}
/** Emite link auditado somente sob ação; não deve ser prefetchado ou persistido.
 * @example await getDocumentLink(id, "front")
 */
export function getDocumentLink(
  id: string,
  kind: DocumentKind,
  transport: HttpTransport = bffClient,
  signal?: AbortSignal,
) {
  return transport.request(
    { method: "GET", path: `${pathOf(id)}/documents/${kind}`, signal, headers: { "cache-control": "no-store" } },
    signedDocumentSchema,
  );
}
/** Aprova com nota obrigatória, sem retry automático. @example await approveApplication(id, { reason: "Conferido" }) */
export function approveApplication(
  id: string,
  body: z.input<typeof approveSchema>,
  transport: HttpTransport = bffClient,
) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/approval`, body: approveSchema.parse(body) },
    adminApplicationSchema,
  );
}
/** Envia recusa validada; fraude só deve ser chamada após confirmação na interface.
 * @example await rejectApplication(id, { reason: "Foto cortada", rejectionReason: "document_illegible" })
 */
export function rejectApplication(
  id: string,
  body: z.input<typeof rejectionBody>,
  transport: HttpTransport = bffClient,
) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/rejection`, body: rejectionBody.parse(body) },
    adminApplicationSchema,
  );
}
