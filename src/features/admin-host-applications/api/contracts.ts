import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1HostApplicationsApplicationIdResponse,
  GetApiV1HostApplicationsApplicationIdDocumentsKindResponse,
} from "@/shared/api/generated/host-applications/host-applications.zod";

/** Status documentados pela API; independentes dos rótulos da verificação pessoal.
 * @example applicationStatusSchema.parse("submitted")
 */
export const applicationStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
  "rejected_final",
  "cancelled",
  "expired",
]);
/** Vagas auditadas de documento. @example documentKindSchema.parse("selfie") */
export const documentKindSchema = z.enum(["front", "back", "selfie"]);
/** Recusas comuns; fraude usa fluxo separado. @example commonRejectionSchema.parse("other") */
export const commonRejectionSchema = z.enum([
  "document_illegible",
  "document_expired",
  "selfie_mismatch",
  "data_mismatch",
  "missing_document",
  "other",
]);
/** Detalhe administrativo derivado do OpenAPI e estreitado pelos enums documentados.
 * @example adminApplicationSchema.parse(dto)
 */
export const adminApplicationSchema = unwrapData(GetApiV1HostApplicationsApplicationIdResponse).extend({
  status: applicationStatusSchema,
  personType: z.enum(["pf", "pj"]),
  documentType: z.enum(["rg", "cnh", "cin"]),
  rejectionReason: z.enum([...commonRejectionSchema.options, "suspected_fraud"]).nullish(),
  documents: z.array(
    unwrapData(GetApiV1HostApplicationsApplicationIdResponse).shape.documents.element.extend({
      kind: documentKindSchema,
    }),
  ),
});
/** Lista administrativa sem paginação na API. @example adminApplicationListSchema.parse([]) */
export const adminApplicationListSchema = z.array(adminApplicationSchema);
/** Link privado temporário, em segundos Unix; só memória do diálogo. @example signedDocumentSchema.parse(dto) */
export const signedDocumentSchema = unwrapData(GetApiV1HostApplicationsApplicationIdDocumentsKindResponse).extend({
  kind: documentKindSchema,
  url: z.string().url(),
});
/** Modelo administrativo sem DTO paralelo manual. @example const item: AdminApplication = adminApplicationSchema.parse(dto); */
export type AdminApplication = z.output<typeof adminApplicationSchema>;
/** Status aceito no filtro. @example const status: ApplicationStatus = "submitted"; */
export type ApplicationStatus = z.output<typeof applicationStatusSchema>;
/** Tipo de foto permitido no endpoint. @example const kind: DocumentKind = "front"; */
export type DocumentKind = z.output<typeof documentKindSchema>;
