import { afterEach, describe, expect, it } from "vitest";
import {
  hostApplicationsHandlers,
  resetHostApplications,
  seedHostApplication,
} from "../../../e2e/support/handlers/hostApplications.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import {
  GetApiV1HostsMeApplicationResponse,
  PatchApiV1HostsMeApplicationResponse,
  PutApiV1HostsMeApplicationDocumentsResponse,
} from "@/shared/api/generated/hosts/hosts.zod";
import { SYNTHETIC_CPF } from "@/test/fixtures/hostApplication";
import { server } from "./server";

const API = "http://localhost:5099/api/v1";
const PATH = "/hosts/me/application";
const start = { acceptNotice: true, personType: "pf", cpf: SYNTHETIC_CPF, documentType: "cnh" };

afterEach(resetHostApplications);

function account(role = "host", scenario = "unverified") {
  return switchAccounts.find((item) => item.user.role === role && item.scenario === scenario)!;
}

function caller(role = "host", scenario = "unverified") {
  server.use(...hostApplicationsHandlers);
  const { accessToken } = issueSession(account(role, scenario).user);
  return async (path: string, method = "GET", body?: object | FormData) => {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}),
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
}

const photos = (...kinds: string[]) => {
  const data = new FormData();
  for (const kind of kinds) data.append(kind, new File([`foto ${kind}`], `${kind}.jpg`, { type: "image/jpeg" }));
  return data;
};

describe("mock de verificação do anfitrião", () => {
  it("REQ-HVER-002 a REQ-HVER-012 abre, corrige, manda as fotos e envia, no formato do contrato", async () => {
    const call = caller();
    const empty = await call(PATH);
    expect(GetApiV1HostsMeApplicationResponse.parse(empty.body).data).toMatchObject({
      application: null,
      canStartNew: true,
    });

    expect((await call(PATH, "POST", start)).status).toBe(201);
    expect((await call(PATH, "POST", start)).body.error.code).toBe("HOST_APPLICATION_ALREADY_EXISTS");
    const patched = await call(PATH, "PATCH", { documentType: "rg" });
    expect(PatchApiV1HostsMeApplicationResponse.parse(patched.body).data?.documentType).toBe("rg");

    const missing = await call(`${PATH}/submission`, "POST");
    expect([missing.status, missing.body.error.code]).toEqual([422, "HOST_APPLICATION_DOCUMENTS_MISSING"]);

    const uploaded = await call(`${PATH}/documents`, "PUT", photos("front", "back", "selfie"));
    expect(PutApiV1HostsMeApplicationDocumentsResponse.parse(uploaded.body).data?.missingDocuments).toEqual([]);

    const submitted = await call(`${PATH}/submission`, "POST");
    expect(submitted.body.data.status).toBe("submitted");
    expect((await call(PATH, "PATCH", { documentType: "cin" })).body.error.code).toBe("HOST_APPLICATION_NOT_EDITABLE");
    expect((await call(PATH)).body.data.canStartNew).toBe(false);
  });

  it("REQ-HVER-008 foto que não é imagem é recusada na vaga certa, e nenhuma entra", async () => {
    const call = caller();
    await call(PATH, "POST", start);
    const data = photos("front");
    data.append("back", new File(["texto"], "verso.txt", { type: "text/plain" }));
    const refused = await call(`${PATH}/documents`, "PUT", data);
    expect(refused.status).toBe(400);
    expect(refused.body.error.details).toEqual([
      { field: "back", messages: ["Envie uma foto JPG, PNG ou WebP."], errors: [{ code: "IMAGE_UNSUPPORTED_FORMAT" }] },
    ]);
    expect((await call(PATH)).body.data.application.documents).toEqual([]);
  });

  it("REQ-HVER-013 desistir apaga e libera começar de novo, sem gastar tentativa", async () => {
    const call = caller();
    await call(PATH, "POST", start);
    expect((await call(PATH, "DELETE")).body.data.status).toBe("cancelled");
    expect((await call(PATH)).body.data).toMatchObject({ canStartNew: true, remainingAttempts: 3 });
  });

  it("REQ-HVER-014 o E2E semeia uma recusa com tentativas; reset limpa", async () => {
    const call = caller();
    seedHostApplication(account().user.id, { status: "rejected", rejectionReason: "selfie_mismatch" }, 2);
    expect((await call(PATH)).body.data).toMatchObject({
      application: { status: "rejected", rejectionReason: "selfie_mismatch" },
      canStartNew: true,
      remainingAttempts: 2,
    });
    resetHostApplications();
    expect((await call(PATH)).body.data.application).toBeNull();
  });

  it("REQ-HVER-001 só anfitrião tem verificação", async () => {
    expect((await caller("owner", "single")(PATH)).status).toBe(403);
  });
});
