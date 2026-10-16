import { bffClient } from "@/shared/api/client/bffClient";
import { withSessionRetry } from "@/shared/api/client/withSessionRetry";
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
 * Manda as fotos num pedido só (REQ-HVER-008), uma parte por vaga, na ordem frente, verso, selfie. O `FormData` é
 * montado na hora, a partir dos `File` da memória: no 401, renova a sessão uma vez e monta de novo. Tudo ou nada na
 * API: o erro aponta a vaga (`fieldErrors.back`).
 * @example await uploadDocuments({ front, back, selfie });
 */
export function uploadDocuments(
  files: DocumentFiles,
  transport: HttpTransport = bffClient,
): Promise<HostApplicationDto> {
  return withSessionRetry(() => {
    const body = new FormData();
    for (const kind of DOCUMENT_KINDS) {
      const file = files[kind];
      if (file) body.append(kind, file);
    }
    return transport.request({ method: "PUT", path: `${PATH}/documents`, body }, hostApplicationDtoSchema);
  }, transport);
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
