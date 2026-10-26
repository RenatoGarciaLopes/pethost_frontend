import { bffClient } from "@/shared/api/client/bffClient";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { reasonSchema } from "@/shared/lib/validation/reasonSchema";
import { adminHostSchema, adminHostListSchema, type StripeStatus } from "../contracts";
const pathOf = (id: string) => `/hosts/${encodeURIComponent(id)}`;
/** Lista administrativa com filtro de recebimento no servidor; undefined significa todos.
 * @example await listHosts("rejected")
 */
export function listHosts(stripeStatus?: StripeStatus, transport: HttpTransport = bffClient, signal?: AbortSignal) {
  return transport.request({ method: "GET", path: "/hosts", query: { stripeStatus }, signal }, adminHostListSchema);
}
/** Detalhe administrativo pelo hostId. @example await getHost(id) */
export function getHost(id: string, transport: HttpTransport = bffClient, signal?: AbortSignal) {
  return transport.request({ method: "GET", path: pathOf(id), signal }, adminHostSchema);
}
/** Suspende perfil e conta, sempre com motivo. @example await suspendHost(id, { reason: "Conferido" }) */
export function suspendHost(id: string, body: { reason: string }, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/suspension`, body: reasonSchema.parse(body) },
    adminHostSchema,
  );
}
/** Retira suspensão sem inventar corpo para DELETE. @example await liftHostSuspension(id) */
export function liftHostSuspension(id: string, transport: HttpTransport = bffClient) {
  return transport.request({ method: "DELETE", path: `${pathOf(id)}/suspension` }, adminHostSchema);
}
/** Libera CPF e, na empresa, CNPJ; exige suspensão e confirmação na interface.
 * @example await releaseHostIdentity(id, { reason: "Disputa conferida" })
 */
export function releaseHostIdentity(id: string, body: { reason: string }, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/identity-release`, body: reasonSchema.parse(body) },
    adminHostSchema,
  );
}
/** Desvincula apenas conta Stripe recusada; não cria outra conta nem libera repasses.
 * @example await resetHostStripeAccount(id, { reason: "Dados corrigidos" })
 */
export function resetHostStripeAccount(id: string, body: { reason: string }, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: `${pathOf(id)}/stripe-account-reset`, body: reasonSchema.parse(body) },
    adminHostSchema,
  );
}
