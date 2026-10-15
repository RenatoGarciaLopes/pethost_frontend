import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { allDocumentsDto, hostApplicationDto, SYNTHETIC_CPF } from "@/test/fixtures/hostApplication";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import {
  cancelApplication,
  patchApplication,
  startApplication,
  submitApplication,
  uploadDocuments,
} from "./myApplication.client";

const transport = createBffClient({ baseUrl: "http://localhost/api" });
const photo = (name: string, content = name) => new File([content], name, { type: "image/jpeg" });

describe("myApplication.client", () => {
  it("REQ-HVER-005 abre a solicitação com POST pelo BFF", async () => {
    const body = { acceptNotice: true, personType: "pf", cpf: SYNTHETIC_CPF, documentType: "cnh" };
    server.use(
      http.post("*/api/hosts/me/application", async ({ request }) => {
        expect(await request.json()).toEqual(body);
        expect(request.headers.get("x-pethost-request")).toBe("1");
        return HttpResponse.json(apiOk(hostApplicationDto()), { status: 201 });
      }),
    );
    expect((await startApplication(body, transport)).status).toBe("draft");
  });

  it("REQ-HVER-005 corrige o rascunho com PATCH só do que mudou", async () => {
    server.use(
      http.patch("*/api/hosts/me/application", async ({ request }) => {
        expect(await request.json()).toEqual({ documentType: "rg" });
        return HttpResponse.json(apiOk(hostApplicationDto({ documentType: "rg" })));
      }),
    );
    expect((await patchApplication({ documentType: "rg" }, transport)).documentType).toBe("rg");
  });

  it("REQ-HVER-008 manda as fotos num pedido só, uma parte por vaga, na ordem das vagas", async () => {
    server.use(
      http.put("*/api/hosts/me/application/documents", async ({ request }) => {
        expect(request.headers.get("content-type")).toMatch(/^multipart\/form-data; boundary=/);
        const data = await request.formData();
        expect([...data.keys()]).toEqual(["front", "selfie"]);
        expect(await (data.get("front") as File).text()).toBe("frente");
        expect(await (data.get("selfie") as File).text()).toBe("selfie");
        return HttpResponse.json(
          apiOk(
            hostApplicationDto({ documents: [allDocumentsDto[0], allDocumentsDto[2]], missingDocuments: ["back"] }),
          ),
        );
      }),
    );
    const application = await uploadDocuments(
      { selfie: photo("selfie.jpg", "selfie"), front: photo("frente.jpg", "frente") },
      transport,
    );
    expect(application.missingDocuments).toEqual(["back"]);
  });

  it("REQ-HVER-008 401 renova a sessão uma vez e reenvia as mesmas fotos da memória", async () => {
    let attempts = 0;
    server.use(
      http.put("*/api/hosts/me/application/documents", async ({ request }) => {
        attempts += 1;
        expect([...(await request.formData()).keys()]).toEqual(["front"]);
        return attempts === 1
          ? HttpResponse.json(apiFail("UNAUTHORIZED"), { status: 401 })
          : HttpResponse.json(apiOk(hostApplicationDto()));
      }),
      http.post("*/api/auth/sessions/refresh", () => HttpResponse.json(apiOk({ user: sessionUserFixture }))),
    );
    await uploadDocuments({ front: photo("frente.jpg") }, transport);
    expect(attempts).toBe(2);
  });

  it.each([
    [400, "VALIDATION_ERROR", { details: [{ field: "back", messages: ["Arquivo inválido"] }] }],
    [409, "HOST_APPLICATION_DOCUMENT_ALREADY_EXISTS", {}],
    [413, "PAYLOAD_TOO_LARGE", {}],
  ])("REQ-HVER-008 foto recusada %s %s chega com o código e a vaga", async (status, code, extra) => {
    server.use(
      http.put("*/api/hosts/me/application/documents", () =>
        HttpResponse.json(apiFail(String(code), String(code), (extra as { details?: unknown }).details), {
          status: Number(status),
        }),
      ),
    );
    const error = await uploadDocuments({ back: photo("verso.jpg") }, transport).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status, code });
    if (code === "VALIDATION_ERROR") expect(error).toMatchObject({ fieldErrors: { back: ["Arquivo inválido"] } });
  });

  it("REQ-HVER-010 envia para análise", async () => {
    server.use(
      http.post("*/api/hosts/me/application/submission", () =>
        HttpResponse.json(apiOk(hostApplicationDto({ status: "submitted", missingDocuments: [] }))),
      ),
    );
    expect((await submitApplication(transport)).status).toBe("submitted");
  });

  it("REQ-HVER-013 desiste com DELETE", async () => {
    server.use(
      http.delete("*/api/hosts/me/application", () =>
        HttpResponse.json(apiOk(hostApplicationDto({ status: "cancelled" }))),
      ),
    );
    expect((await cancelApplication(transport)).status).toBe("cancelled");
  });
});
