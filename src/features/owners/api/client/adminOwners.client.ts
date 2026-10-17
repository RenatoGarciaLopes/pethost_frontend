import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { reasonSchema } from "@/shared/lib/validation/reasonSchema";
import { adminOwnerSchema, adminOwnerListSchema } from "../contracts";
const pathOf = (id: string) => `/owners/${encodeURIComponent(id)}`;
/** Lista administrativa completa, sem dados de busca na URL. @example await listOwners() */
export function listOwners(transport: HttpTransport = bffClient, signal?: AbortSignal) {
  return transport.request({ method: "GET", path: "/owners", signal }, adminOwnerListSchema);
}
/** Detalhe pelo ownerId, nunca userId. @example await getOwner(id) */
export function getOwner(id: string, transport: HttpTransport = bffClient, signal?: AbortSignal) {
  return transport.request({ method: "GET", path: pathOf(id), signal }, adminOwnerSchema);
}
/** Suspende com motivo obrigatório, sem retry. @example await suspendOwner(id, { reason: "Documento conferido" }) */
export function suspendOwner(id: string, body: { reason: string }, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/suspension`, body: reasonSchema.parse(body) },
    adminOwnerSchema,
  );
}
/** Retira suspensão sem corpo, conforme API; a interface confirma o efeito. @example await liftOwnerSuspension(id) */
export function liftOwnerSuspension(id: string, transport: HttpTransport = bffClient) {
  return transport.request({ method: "DELETE", path: `${pathOf(id)}/suspension` }, adminOwnerSchema);
}
/** Liberação irreversível de CPF, após confirmação e suspensão. @example await releaseOwnerCpf(id, { reason: "Disputa conferida" }) */
export function releaseOwnerCpf(id: string, body: { reason: string }, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/cpf-release`, body: reasonSchema.parse(body) },
    adminOwnerSchema,
  );
}
