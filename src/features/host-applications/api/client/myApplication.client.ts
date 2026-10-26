import { bffClient } from "@/shared/api/client/bffClient";
import { stageDirectUpload, confirmDocumentUploads } from "@/shared/api/client/uploadDirect";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { DOCUMENT_KINDS, hostApplicationDtoSchema, type HostApplicationDto } from "../contracts";
import type { PatchApplicationRequest, StartApplicationRequest } from "../toApplicationRequest";
import type { DocumentKind } from "../../types";

const PATH = "/hosts/me/application";

/** Fotos a enviar, por vaga; vaga ausente fica como está na API. */
export type DocumentFiles = Partial<Record<DocumentKind, File>>;

/**
 * Abre a solicitação (rascunho). Não repete sozinho: 409 `HOST_APPLICATION_ALREADY_EXISTS` volta para a tela.
 * @example await startApplication(toStartApplicationRequest(values));
 */
export function startApplication(
  body: StartApplicationRequest,
  transport: HttpTransport = bffClient,
): Promise<HostApplicationDto> {
  return transport.request({ method: "POST", path: PATH, body }, hostApplicationDtoSchema);
}

/**
 * Corrige o rascunho com só o que mudou (`toPatchApplicationRequest`).
 * @example await patchApplication({ documentType: "rg" });
 */
export function patchApplication(
  body: PatchApplicationRequest,
  transport: HttpTransport = bffClient,
): Promise<HostApplicationDto> {
  return transport.request({ method: "PATCH", path: PATH, body }, hostApplicationDtoSchema);
}

/**
 * Stages document files independently and confirms all selected slots atomically.
 * @example await uploadDocuments({ front, back, selfie });
 */
export async function uploadDocuments(
  files: DocumentFiles,
  transport: HttpTransport = bffClient,
): Promise<HostApplicationDto> {
  const tickets = [];
  for (const kind of DOCUMENT_KINDS) {
    const file = files[kind];
    if (file) tickets.push(await stageDirectUpload(file, { purpose: "host-document", kind }, transport));
  }
  return confirmDocumentUploads(
    tickets.map((ticket) => ticket.uploadId),
    hostApplicationDtoSchema,
    transport,
  );
}

/**
 * Envia o rascunho para a análise (exige as três fotos).
 * @example await submitApplication();
 */
export function submitApplication(transport: HttpTransport = bffClient): Promise<HostApplicationDto> {
  return transport.request({ method: "POST", path: `${PATH}/submission` }, hostApplicationDtoSchema);
}

/**
 * Desiste do rascunho ou da análise: as fotos são apagadas e não gasta tentativa.
 * @example await cancelApplication();
 */
export function cancelApplication(transport: HttpTransport = bffClient): Promise<HostApplicationDto> {
  return transport.request({ method: "DELETE", path: PATH }, hostApplicationDtoSchema);
}
