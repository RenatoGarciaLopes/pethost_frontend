import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import {
  GetApiV1HostsMeApplicationResponse,
  PatchApiV1HostsMeApplicationResponse,
} from "@/shared/api/generated/hosts/hosts.zod";

/** Status da solicitação (`modulo-hosts.md` seção 1). */
export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "rejected_final",
  "cancelled",
  "expired",
] as const;
/** As três vagas de foto, na ordem em que a tela pede. */
export const DOCUMENT_KINDS = ["front", "back", "selfie"] as const;
/** Documentos aceitos (`documentType`). */
export const DOCUMENT_TYPES = ["rg", "cnh", "cin"] as const;
/** Pessoa física ou empresa (`personType`). */
export const PERSON_TYPES = ["pf", "pj"] as const;
/** Motivos de recusa que a pessoa pode ler (`suspected_fraud` nunca chega como `rejected`). */
export const REJECTION_REASONS = [
  "document_illegible",
  "document_expired",
  "selfie_mismatch",
  "data_mismatch",
  "missing_document",
  "other",
] as const;

/** A API aceita maiúsculas (`PJ`); a leitura normaliza antes de estreitar. */
const lowercaseEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (typeof value === "string" ? value.toLowerCase() : value), z.enum(values));

export const applicationStatusSchema = lowercaseEnum([...APPLICATION_STATUSES]);
export const documentKindSchema = lowercaseEnum([...DOCUMENT_KINDS]);
export const documentTypeSchema = lowercaseEnum([...DOCUMENT_TYPES]);
export const personTypeSchema = lowercaseEnum([...PERSON_TYPES]);

/**
 * A solicitação como a própria pessoa vê, com status, tipo de pessoa, documento e vagas estreitados. Valor
 * desconhecido = `CONTRACT_MISMATCH`. O motivo da recusa fica texto: o mapper troca o desconhecido por `other`.
 */
export const hostApplicationDtoSchema = unwrapData(PatchApiV1HostsMeApplicationResponse).extend({
  status: applicationStatusSchema,
  personType: personTypeSchema,
  documentType: documentTypeSchema,
  documents: z.array(z.object({ kind: documentKindSchema, uploadedAt: z.string() })),
  missingDocuments: z.array(documentKindSchema),
});

/**
 * `GET /hosts/me/application` (REQ-HVER-002): a solicitação mais recente (ou nenhuma), se dá pra abrir outra e a
 * versão do aviso das fotos.
 * @example myApplicationSchema.parse({ application: null, canStartNew: true, remainingAttempts: 3, noticeVersion })
 */
export const myApplicationSchema = unwrapData(GetApiV1HostsMeApplicationResponse).extend({
  application: hostApplicationDtoSchema.nullish(),
});

export type HostApplicationDto = z.output<typeof hostApplicationDtoSchema>;
export type MyApplicationDto = z.output<typeof myApplicationSchema>;
