import { fieldIssue } from "./fieldIssue.mjs";
import { http } from "msw";
import { z } from "zod";
import { unwrapData } from "../../../src/shared/api/contracts/unwrapData.ts";
import {
  GetApiV1OwnersResponse,
  GetApiV1OwnersOwnerIdResponse,
} from "../../../src/shared/api/generated/owners/owners.zod.ts";
import {
  GetApiV1HostsResponse,
  GetApiV1HostsHostIdResponse,
} from "../../../src/shared/api/generated/hosts-admin/hosts-admin.zod.ts";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const ownerListSchema = unwrapData(GetApiV1OwnersResponse);
const ownerSchema = unwrapData(GetApiV1OwnersOwnerIdResponse);
const hostListSchema = unwrapData(GetApiV1HostsResponse);
const hostSchema = unwrapData(GetApiV1HostsHostIdResponse);
const reasonSchema = z.object({ reason: z.string().trim().min(1).max(500) });
const createdAt = "2026-10-01T12:00:00.000Z";
const uuid = (number) => `0199d2a0-0000-7000-8000-${String(number).padStart(12, "0")}`;

function accountUser(number, role, name, isActive = true) {
  return {
    id: uuid(number),
    fullName: name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@example.test`,
    role,
    phone: "11999999999",
    birthDate: "1990-01-01",
    address: { city: "Maringá", state: "PR" },
    isActive,
    createdAt,
  };
}

/** Cria e valida um perfil sintético de tutor para lista e detalhe administrativo.
 * @example owner(3201, "João de teste")
 */
function owner(number, name, options = {}) {
  return ownerSchema.parse({
    id: uuid(number),
    userId: uuid(number + 100),
    cpf: options.cpf ?? "52998224725",
    isActive: options.isActive ?? true,
    ...(options.suspendedAt ? { suspendedAt: options.suspendedAt } : {}),
    createdAt,
    user: {
      ...accountUser(number + 100, "owner", name, options.isActive ?? true),
      ...(options.suspendedAt ? { suspendedAt: options.suspendedAt, suspensionReason: options.suspensionReason } : {}),
    },
  });
}

/** Cria e valida um anfitrião sintético, incluindo estado Stripe e evidência liberada.
 * @example host(3302, "Dani Stripe recusado", { stripeStatus: "rejected", personType: "pj" })
 */
function host(number, name, options = {}) {
  const identityReleasedAt = options.identityReleasedAt;
  const personType = options.personType ?? "pf";
  return hostSchema.parse({
    id: uuid(number),
    userId: uuid(number + 100),
    personType,
    cpf: options.cpf ?? "11144477735",
    ...(personType === "pj"
      ? {
          company: {
            cnpj: "11222333000181",
            legalName: "Hospedagem de teste Ltda.",
            tradeName: "Quintal de teste",
            address: { city: "Maringá", state: "PR" },
          },
        }
      : {}),
    verifiedAt: createdAt,
    isActive: options.isActive ?? true,
    ...(options.suspendedAt ? { suspendedAt: options.suspendedAt } : {}),
    ...(identityReleasedAt ? { identityReleasedAt } : {}),
    stripeConnected: options.stripeStatus !== "not_started",
    stripePayoutsEnabled: options.stripePayoutsEnabled ?? options.stripeStatus === "enabled",
    stripeStatus: options.stripeStatus ?? "in_progress",
    createdAt,
    user: {
      ...accountUser(number + 100, "host", name, options.isActive ?? true),
      ...(options.suspendedAt ? { suspendedAt: options.suspendedAt, suspensionReason: options.suspensionReason } : {}),
    },
  });
}

let owners;
let hosts;
const previousOwnerState = new Map();
const previousHostState = new Map();

/** Restaura somente contas fictícias do cenário administrativo. @example resetAdminAccounts(); */
export function resetAdminAccounts() {
  previousOwnerState.clear();
  previousHostState.clear();
  owners = [
    owner(3201, "João de teste"),
    owner(3202, "Ana suspensa", {
      isActive: false,
      suspendedAt: createdAt,
      suspensionReason: "Disputa documental em análise",
    }),
    owner(3203, "Bia liberada", {
      cpf: null,
      isActive: false,
      suspendedAt: createdAt,
      suspensionReason: "CPF liberado após conferência",
    }),
  ];
  hosts = [
    host(3301, "Carlos anfitrião", { stripeStatus: "in_progress" }),
    host(3302, "Dani Stripe recusado", { stripeStatus: "rejected", personType: "pj" }),
    host(3303, "Eva identidade liberada", { stripeStatus: "under_review", identityReleasedAt: createdAt }),
    host(3304, "Ana empresa", { stripeStatus: "in_progress", personType: "pj" }),
  ];
}
resetAdminAccounts();

function authorized(request) {
  const user = sessionUserOf(request);
  return !user
    ? { error: fail(401, "UNAUTHORIZED") }
    : user.role !== "admin"
      ? { error: fail(403, "FORBIDDEN") }
      : { user };
}

function find(request, records, id, missingCode) {
  const auth = authorized(request);
  if (auth.error) return { error: auth.error };
  const record = records.find((item) => item.id === id);
  return record ? { record, user: auth.user } : { error: fail(404, missingCode) };
}

function validateReason(request) {
  return request
    .json()
    .catch(() => null)
    .then((body) => reasonSchema.safeParse(body));
}

const stripeStatuses = ["not_started", "in_progress", "under_review", "restricted", "rejected", "enabled"];

/** MSW simulado dos endpoints administrativos de tutores e anfitriões; exige sessão admin.
 * @example server.use(...adminAccountsHandlers)
 */
export const adminAccountsHandlers = [
  http.get(`${API}/owners`, ({ request }) => {
    const auth = authorized(request);
    if (auth.error) return auth.error;
    return ok(ownerListSchema.parse(owners));
  }),
  http.get(`${API}/owners/:id`, ({ request, params }) => {
    const result = find(request, owners, params.id, "OWNER_NOT_FOUND");
    return result.error ?? ok(result.record);
  }),
  http.post(`${API}/owners/:id/suspension`, async ({ request, params }) => {
    const result = find(request, owners, params.id, "OWNER_NOT_FOUND");
    if (result.error) return result.error;
    const body = await validateReason(request);
    if (!body.success)
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("reason", "Escreva um motivo de até 500 caracteres.", "AUTH_SUSPENSION_REASON_TOO_LONG", {
          max: 500,
        }),
      ]);
    if (result.record.cpf == null) return fail(422, "OWNER_CPF_RELEASED");
    if (result.record.suspendedAt) return fail(422, "OWNER_SUSPENSION_REQUIRED");
    previousOwnerState.set(result.record.id, {
      profileActive: result.record.isActive,
      userActive: result.record.user?.isActive,
    });
    const suspendedAt = new Date().toISOString();
    Object.assign(result.record, { isActive: false, suspendedAt });
    Object.assign(result.record.user, { isActive: false, suspendedAt, suspensionReason: body.data.reason });
    return ok(result.record);
  }),
  http.delete(`${API}/owners/:id/suspension`, ({ request, params }) => {
    const result = find(request, owners, params.id, "OWNER_NOT_FOUND");
    if (result.error) return result.error;
    if (result.record.cpf == null) return fail(422, "OWNER_CPF_RELEASED");
    if (!result.record.suspendedAt) return fail(422, "OWNER_SUSPENSION_REQUIRED");
    const prior = previousOwnerState.get(result.record.id) ?? { profileActive: true, userActive: true };
    delete result.record.suspendedAt;
    delete result.record.user.suspendedAt;
    delete result.record.user.suspensionReason;
    Object.assign(result.record, { isActive: prior.profileActive });
    Object.assign(result.record.user, { isActive: prior.userActive });
    previousOwnerState.delete(result.record.id);
    return ok(result.record);
  }),
  http.post(`${API}/owners/:id/cpf-release`, async ({ request, params }) => {
    const result = find(request, owners, params.id, "OWNER_NOT_FOUND");
    if (result.error) return result.error;
    const body = await validateReason(request);
    if (!body.success)
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("reason", "Escreva um motivo de até 500 caracteres.", "AUTH_SUSPENSION_REASON_TOO_LONG", {
          max: 500,
        }),
      ]);
    if (result.record.cpf == null) return fail(422, "OWNER_CPF_RELEASED");
    if (!result.record.suspendedAt) return fail(422, "OWNER_SUSPENSION_REQUIRED");
    result.record.cpf = null;
    return ok(result.record);
  }),
  http.get(`${API}/hosts`, ({ request }) => {
    const auth = authorized(request);
    if (auth.error) return auth.error;
    const status = new URL(request.url).searchParams.get("stripeStatus");
    if (status && !stripeStatuses.includes(status))
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("stripeStatus", "Escolha um status de recebimento conhecido.", "HOST_STRIPE_STATUS_FILTER_INVALID"),
      ]);
    const listed = status ? hosts.filter((item) => item.stripeStatus === status) : hosts;
    return ok(hostListSchema.parse(listed));
  }),
  http.get(`${API}/hosts/:id`, ({ request, params }) => {
    const result = find(request, hosts, params.id, "HOST_NOT_FOUND");
    return result.error ?? ok(result.record);
  }),
  http.post(`${API}/hosts/:id/suspension`, async ({ request, params }) => {
    const result = find(request, hosts, params.id, "HOST_NOT_FOUND");
    if (result.error) return result.error;
    const body = await validateReason(request);
    if (!body.success)
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("reason", "Escreva um motivo de até 500 caracteres.", "AUTH_SUSPENSION_REASON_TOO_LONG", {
          max: 500,
        }),
      ]);
    if (result.record.identityReleasedAt) return fail(422, "HOST_IDENTITY_RELEASED");
    if (result.record.suspendedAt) return fail(422, "HOST_SUSPENSION_REQUIRED");
    previousHostState.set(result.record.id, {
      profileActive: result.record.isActive,
      userActive: result.record.user?.isActive,
    });
    const suspendedAt = new Date().toISOString();
    Object.assign(result.record, { isActive: false, suspendedAt });
    Object.assign(result.record.user, { isActive: false, suspendedAt, suspensionReason: body.data.reason });
    return ok(result.record);
  }),
  http.delete(`${API}/hosts/:id/suspension`, ({ request, params }) => {
    const result = find(request, hosts, params.id, "HOST_NOT_FOUND");
    if (result.error) return result.error;
    if (result.record.identityReleasedAt) return fail(422, "HOST_IDENTITY_RELEASED");
    if (!result.record.suspendedAt) return fail(422, "HOST_SUSPENSION_REQUIRED");
    const prior = previousHostState.get(result.record.id) ?? { profileActive: true, userActive: true };
    delete result.record.suspendedAt;
    delete result.record.user.suspendedAt;
    delete result.record.user.suspensionReason;
    Object.assign(result.record, { isActive: prior.profileActive });
    Object.assign(result.record.user, { isActive: prior.userActive });
    previousHostState.delete(result.record.id);
    return ok(result.record);
  }),
  http.post(`${API}/hosts/:id/identity-release`, async ({ request, params }) => {
    const result = find(request, hosts, params.id, "HOST_NOT_FOUND");
    if (result.error) return result.error;
    const body = await validateReason(request);
    if (!body.success)
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("reason", "Escreva um motivo de até 500 caracteres.", "AUTH_SUSPENSION_REASON_TOO_LONG", {
          max: 500,
        }),
      ]);
    if (result.record.identityReleasedAt) return fail(422, "HOST_IDENTITY_RELEASED");
    if (!result.record.suspendedAt) return fail(422, "HOST_SUSPENSION_REQUIRED");
    result.record.identityReleasedAt = new Date().toISOString();
    return ok(result.record);
  }),
  http.post(`${API}/hosts/:id/stripe-account-reset`, async ({ request, params }) => {
    const result = find(request, hosts, params.id, "HOST_NOT_FOUND");
    if (result.error) return result.error;
    const body = await validateReason(request);
    if (!body.success)
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("reason", "Escreva um motivo de até 500 caracteres.", "AUTH_SUSPENSION_REASON_TOO_LONG", {
          max: 500,
        }),
      ]);
    if (result.record.identityReleasedAt) return fail(422, "HOST_IDENTITY_RELEASED");
    if (result.record.stripeStatus !== "rejected") return fail(422, "HOST_STRIPE_ACCOUNT_NOT_REJECTED");
    Object.assign(result.record, { stripeStatus: "not_started", stripeConnected: false, stripePayoutsEnabled: false });
    return ok(result.record);
  }),
];
