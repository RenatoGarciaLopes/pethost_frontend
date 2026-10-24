import { fieldIssue } from "./fieldIssue.mjs";
import { http, HttpResponse } from "msw";
import { ok, fail, sessionUserOf } from "./session.mjs";
import { z } from "zod";
import { unwrapData } from "../../../src/shared/api/contracts/unwrapData.ts";
import {
  GetApiV1HostApplicationsApplicationIdResponse,
  PostApiV1HostApplicationsApplicationIdApprovalBody,
  PostApiV1HostApplicationsApplicationIdRejectionBody,
} from "../../../src/shared/api/generated/host-applications/host-applications.zod.ts";
const adminApplicationSchema = unwrapData(GetApiV1HostApplicationsApplicationIdResponse);
const reason = z.string().trim().min(1).max(500);
const approveSchema = PostApiV1HostApplicationsApplicationIdApprovalBody.extend({ reason });
const rejectSchema = PostApiV1HostApplicationsApplicationIdRejectionBody.extend({
  reason,
  rejectionReason: z.enum([
    "document_illegible",
    "document_expired",
    "selfie_mismatch",
    "data_mismatch",
    "missing_document",
    "other",
    "suspected_fraud",
  ]),
});

const API = "http://localhost:5099/api/v1/host-applications";
const IMAGE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMZ8AAAAASUVORK5CYII=",
  "base64",
);
const idOf = (number) => `0199d2a0-0000-7000-8000-${String(number).padStart(12, "0")}`;
function seed(index) {
  const date = `2026-10-${String(index + 1).padStart(2, "0")}T12:00:00Z`;
  return adminApplicationSchema.parse({
    id: idOf(index + 3100),
    userId: idOf(index + 4100),
    status: "submitted",
    personType: index === 1 ? "pj" : "pf",
    cpf: "52998224725",
    documentType: "cnh",
    attemptNumber: 1,
    noticeVersion: "v1",
    noticeAcceptedAt: date,
    createdAt: date,
    submittedAt: date,
    company:
      index === 1
        ? {
            cnpj: "11222333000181",
            legalName: "Empresa de teste",
            tradeName: "Casa de teste",
            address: { city: "Maringá", state: "PR" },
          }
        : null,
    documents: ["front", "back", "selfie"].map((kind) => ({
      kind,
      sizeBytes: IMAGE.length,
      uploadedAt: date,
      path: `/api/v1/host-applications/${idOf(index + 3100)}/documents/${kind}`,
    })),
    missingDocuments: [],
    user: {
      id: idOf(index + 4100),
      fullName: `Pessoa ${String(index + 1).padStart(2, "0")}`,
      email: `pessoa${index + 1}@example.test`,
      role: "host",
      phone: "11999999999",
      birthDate: "1990-01-01",
      address: { city: "Maringá", state: "PR" },
      isActive: true,
      createdAt: date,
    },
  });
}
let applications;
/** Restaura apenas solicitações fictícias da fila administrativa. @example resetAdminApplications(); */
export function resetAdminApplications() {
  applications = Array.from({ length: 27 }, (_, index) => seed(index));
}
resetAdminApplications();
function authorize(request) {
  const user = sessionUserOf(request);
  return !user ? fail(401, "UNAUTHORIZED") : user.role !== "admin" ? fail(403, "FORBIDDEN") : null;
}
function find(request, id) {
  const error = authorize(request);
  if (error) return { error };
  const application = applications.find((item) => item.id === id);
  return application ? { application } : { error: fail(404, "HOST_APPLICATION_NOT_FOUND") };
}
async function decide(request, id, approval) {
  const result = find(request, id);
  if (result.error) return result.error;
  if (result.application.status !== "submitted") return fail(422, "HOST_APPLICATION_NOT_UNDER_REVIEW");
  const body = await request.json().catch(() => null);
  const parsed = approval
    ? approveSchema.safeParse(body)
    : body?.rejectionReason === "suspected_fraud"
      ? approveSchema.safeParse(body)
      : rejectSchema.safeParse(body);
  if (!parsed.success)
    return fail(400, "VALIDATION_ERROR", [
      fieldIssue("reason", "Escreva um motivo de até 500 caracteres.", "HOST_REASON_TOO_LONG", { max: 500 }),
    ]);
  Object.assign(result.application, {
    status: approval ? "approved" : body.rejectionReason === "suspected_fraud" ? "rejected_final" : "rejected",
    rejectionReason: approval ? null : body.rejectionReason,
    reviewNotes: parsed.data.reason,
    reviewedBy: sessionUserOf(request).id,
    reviewedAt: new Date().toISOString(),
  });
  return ok(result.application);
}
/** Simulação da fila 031, com 27 itens e imagens fictícias sem cache. Não substitui API real.
 * @example server.use(...adminApplicationsHandlers);
 */
export const adminApplicationsHandlers = [
  http.get(API, ({ request }) => {
    const error = authorize(request);
    if (error) return error;
    const status = new URL(request.url).searchParams.get("status") ?? "submitted";
    if (!["draft", "submitted", "approved", "rejected", "rejected_final", "cancelled", "expired"].includes(status))
      return fail(400, "VALIDATION_ERROR", [
        fieldIssue("status", "Escolha um status conhecido.", "HOST_STATUS_FILTER_INVALID"),
      ]);
    return ok(
      applications.filter((item) => item.status === status).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)),
    );
  }),
  http.get(`${API}/:id`, ({ request, params }) => {
    const result = find(request, params.id);
    return result.error ?? ok(result.application);
  }),
  http.get(`${API}/:id/documents/:kind`, ({ request, params }) => {
    const result = find(request, params.id);
    if (result.error) return result.error;
    if (!result.application.documents.some((doc) => doc.kind === params.kind) || result.application.documentsPurgedAt)
      return fail(404, "HOST_APPLICATION_DOCUMENT_NOT_FOUND");
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    return ok(
      {
        kind: params.kind,
        expiresAt,
        url: `http://localhost:5099/__e2e/admin-documents/${params.id}/${params.kind}?expires=${expiresAt}`,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }),
  http.post(`${API}/:id/approval`, ({ request, params }) => decide(request, params.id, true)),
  http.post(`${API}/:id/rejection`, ({ request, params }) => decide(request, params.id, false)),
  http.get("http://localhost:5099/__e2e/admin-documents/:id/:kind", ({ request }) =>
    Number(new URL(request.url).searchParams.get("expires")) <= Date.now() / 1000
      ? new HttpResponse(null, { status: 403 })
      : new HttpResponse(IMAGE, { headers: { "content-type": "image/png", "cache-control": "private, no-store" } }),
  ),
];
