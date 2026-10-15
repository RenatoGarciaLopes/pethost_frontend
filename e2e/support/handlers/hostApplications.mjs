import { http } from "msw";
import { randomUUID } from "node:crypto";
import { fail, ok, sessionUserOf } from "./session.mjs";

const API = "http://localhost:5099/api/v1";
const PATH = `${API}/hosts/me/application`;
const KINDS = ["front", "back", "selfie"];
const MAX_ATTEMPTS = 3;
const NOTICE_VERSION = "2026-10-10";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Verificação por conta, só em memória: a solicitação mais recente e as tentativas que sobram. */
const byAccount = new Map();

function stateOf(userId) {
  if (!byAccount.has(userId)) byAccount.set(userId, { application: null, remainingAttempts: MAX_ATTEMPTS });
  return byAccount.get(userId);
}

function newApplication(body) {
  const now = new Date().toISOString();
  const company =
    body.personType === "pj"
      ? { cnpj: body.cnpj, legalName: body.legalName, tradeName: body.tradeName, address: body.companyAddress }
      : null;
  return {
    id: randomUUID(),
    status: "draft",
    personType: body.personType ?? "pf",
    cpf: String(body.cpf ?? "").replace(/\D/g, ""),
    documentType: body.documentType,
    company,
    attemptNumber: 1,
    documents: [],
    missingDocuments: [...KINDS],
    rejectionReason: null,
    submittedAt: null,
    reviewedAt: null,
    closedAt: null,
    documentsPurgedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

const isOpen = (application) => ["draft", "submitted"].includes(application?.status);

function mine(state) {
  const { application, remainingAttempts } = state;
  const blocked = application?.status === "rejected_final";
  const verified = application?.status === "approved";
  return {
    application,
    canStartNew: !isOpen(application) && !blocked && !verified && remainingAttempts > 0,
    remainingAttempts,
    noticeVersion: NOTICE_VERSION,
  };
}

/** Anfitrião dono da sessão ou a resposta de erro. */
function hostOf(request) {
  const user = sessionUserOf(request);
  if (!user) return { error: fail(401, "UNAUTHORIZED") };
  if (user.role !== "host") return { error: fail(403, "FORBIDDEN") };
  return { state: stateOf(user.id) };
}

function draftOf(request) {
  const result = hostOf(request);
  if (result.error) return result;
  if (result.state.application?.status !== "draft") return { error: fail(422, "HOST_APPLICATION_NOT_EDITABLE") };
  return result;
}

function touch(application, changes) {
  Object.assign(application, changes, { updatedAt: new Date().toISOString() });
  return ok(application);
}

/**
 * Semeia a verificação de uma conta para uma jornada (ex.: recusa com tentativas). Só no mock.
 * @example seedHostApplication(user.id, { status: "rejected", rejectionReason: "selfie_mismatch" }, 2);
 */
export function seedHostApplication(userId, overrides, remainingAttempts = MAX_ATTEMPTS) {
  const application = {
    ...newApplication({ personType: "pf", cpf: "52998224725", documentType: "cnh" }),
    missingDocuments: [],
    ...overrides,
  };
  byAccount.set(userId, { application, remainingAttempts });
}

/** Volta todas as contas para "nunca pediu", entre jornadas. @example resetHostApplications(); */
export function resetHostApplications() {
  byAccount.clear();
}

/**
 * `/hosts/me/application*` do mock (spec 030): abrir, corrigir, fotos (multipart, tudo ou nada), enviar e desistir,
 * com os códigos de erro do contrato. Não confere CPF nem rosto: é só para a jornada da tela.
 * @example app.use(createMiddleware(...hostApplicationsHandlers));
 */
export const hostApplicationsHandlers = [
  http.get(PATH, ({ request }) => {
    const result = hostOf(request);
    return result.error ?? ok(mine(result.state));
  }),
  http.post(PATH, async ({ request }) => {
    const result = hostOf(request);
    if (result.error) return result.error;
    const { state } = result;
    if (isOpen(state.application)) return fail(409, "HOST_APPLICATION_ALREADY_EXISTS");
    if (!mine(state).canStartNew) return fail(422, "HOST_APPLICATION_ATTEMPTS_EXCEEDED");
    const body = (await request.json().catch(() => null)) ?? {};
    const errors = [];
    if (body.acceptNotice !== true) errors.push({ field: "acceptNotice", messages: ["Aceite o aviso."] });
    if (String(body.cpf ?? "").replace(/\D/g, "").length !== 11)
      errors.push({ field: "cpf", messages: ["CPF inválido."] });
    if (!["rg", "cnh", "cin"].includes(body.documentType))
      errors.push({ field: "documentType", messages: ["Escolha o documento."] });
    if (errors.length) return fail(400, "VALIDATION_ERROR", errors);
    state.application = { ...newApplication(body), attemptNumber: MAX_ATTEMPTS - state.remainingAttempts + 1 };
    return ok(state.application, { status: 201 });
  }),
  http.patch(PATH, async ({ request }) => {
    const result = draftOf(request);
    if (result.error) return result.error;
    const body = (await request.json().catch(() => null)) ?? {};
    const { application } = result.state;
    const changes = {};
    if (body.cpf) changes.cpf = String(body.cpf).replace(/\D/g, "");
    if (body.documentType) changes.documentType = body.documentType;
    return touch(application, changes);
  }),
  http.put(`${PATH}/documents`, async ({ request }) => {
    const result = draftOf(request);
    if (result.error) return result.error;
    const data = await request.formData();
    const parts = KINDS.filter((kind) => data.get(kind));
    if (parts.length === 0)
      return fail(400, "VALIDATION_ERROR", [{ field: "documents", messages: ["Envie as fotos."] }]);
    const refused = parts.find((kind) => !IMAGE_TYPES.includes(data.get(kind).type));
    if (refused)
      return fail(400, "VALIDATION_ERROR", [{ field: refused, messages: ["Envie uma foto JPG, PNG ou WebP."] }]);
    const { application } = result.state;
    const uploadedAt = new Date().toISOString();
    const documents = [
      ...application.documents.filter((document) => !parts.includes(document.kind)),
      ...parts.map((kind) => ({ kind, uploadedAt })),
    ];
    const missingDocuments = KINDS.filter((kind) => !documents.some((document) => document.kind === kind));
    return touch(application, { documents, missingDocuments });
  }),
  http.post(`${PATH}/submission`, ({ request }) => {
    const result = draftOf(request);
    if (result.error) return result.error;
    const { application } = result.state;
    if (application.missingDocuments.length > 0) return fail(422, "HOST_APPLICATION_DOCUMENTS_MISSING");
    return touch(application, { status: "submitted", submittedAt: new Date().toISOString() });
  }),
  http.delete(PATH, ({ request }) => {
    const result = hostOf(request);
    if (result.error) return result.error;
    const { application } = result.state;
    if (!isOpen(application)) return fail(422, "HOST_APPLICATION_NOT_EDITABLE");
    const now = new Date().toISOString();
    return touch(application, { status: "cancelled", closedAt: now, documentsPurgedAt: now, documents: [] });
  }),
];
