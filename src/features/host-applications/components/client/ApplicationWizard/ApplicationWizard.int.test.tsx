import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FlashMessageProvider } from "@/shared/hooks/useFlashMessage";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import {
  allDocumentsDto,
  hostApplicationDto,
  myApplicationDto,
  SYNTHETIC_CNPJ,
  SYNTHETIC_CPF,
} from "@/test/fixtures/hostApplication";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { fakeImageCanvas } from "@/test/imageCanvas";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { verificationCopy as copy } from "../../../lib/verificationCopy";
import { ApplicationWizard } from "./ApplicationWizard";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const ACCOUNT = "account-1";

beforeEach(() => {
  push.mockReset();
  fakeImageCanvas();
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

interface FakeServer {
  application: Record<string, unknown> | null;
}

/** API de verificação em memória: o que as mutações gravam, o GET devolve. */
function fakeApi(state: FakeServer) {
  const requests: string[] = [];
  const respond = (application: Record<string, unknown>, status = 200) => {
    state.application = application;
    return HttpResponse.json(apiOk(application), { status });
  };
  server.use(
    http.get("*/api/hosts/me/application", () =>
      HttpResponse.json(apiOk(myApplicationDto({ application: state.application }))),
    ),
    http.post("*/api/hosts/me/application", async ({ request }) => {
      requests.push(`POST ${JSON.stringify(await request.json())}`);
      return respond(hostApplicationDto(), 201);
    }),
    http.patch("*/api/hosts/me/application", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      requests.push(`PATCH ${JSON.stringify(body)}`);
      return respond({ ...state.application, ...body });
    }),
    http.put("*/api/hosts/me/application/documents", () => {
      requests.push("PUT documents");
      return respond({ ...state.application, documents: allDocumentsDto, missingDocuments: [] });
    }),
    http.post("*/api/hosts/me/application/submission", () => {
      requests.push("POST submission");
      return respond({ ...state.application, status: "submitted" });
    }),
  );
  return requests;
}

function renderWizard(entry: "start" | "documents") {
  return renderWithProviders(
    <FlashMessageProvider>
      <ApplicationWizard accountId={ACCOUNT} entry={entry} />
    </FlashMessageProvider>,
    { theme: quintalTheme },
  );
}

const photo = (name: string) => new File([name], name, { type: "image/jpeg" });

// Jornadas inteiras, digitando campo a campo: folga para a máquina de CI e a local compartilhada.
describe("ApplicationWizard", { timeout: 20000 }, () => {
  it("REQ-HVER-002 a REQ-HVER-010 do aviso ao envio: aceite, dados (POST), fotos (PUT) e análise", async () => {
    const requests = fakeApi({ application: null });
    const { user } = renderWizard("start");

    await screen.findByRole("heading", { level: 1, name: copy.notice.heading });
    expect(screen.getByRole("navigation", { name: copy.wizard.progressLabel })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: copy.notice.accept }));
    await user.click(screen.getByRole("button", { name: copy.notice.next }));

    const heading = await screen.findByRole("heading", { level: 1, name: copy.data.heading });
    await waitFor(() => expect(heading).toHaveFocus());
    await user.type(screen.getByRole("textbox", { name: copy.data.cpf }), SYNTHETIC_CPF);
    await user.click(screen.getByRole("radio", { name: /CNH/ }));
    await user.click(screen.getByRole("button", { name: copy.data.next }));

    await screen.findByRole("heading", { level: 1, name: copy.photos.heading });
    await user.upload(screen.getByLabelText("Foto da frente do documento: galeria"), photo("frente.jpg"));
    await user.upload(screen.getByLabelText("Foto do verso do documento: galeria"), photo("verso.jpg"));
    await user.upload(screen.getByLabelText("Selfie segurando o documento: galeria"), photo("selfie.jpg"));
    await screen.findByRole("button", { name: "Selfie segurando o documento, foto escolhida" });
    await user.click(screen.getByRole("button", { name: copy.photos.next }));

    await screen.findByRole("heading", { level: 1, name: copy.review.heading });
    expect(screen.getByText("***.***.247-25")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.review.submit }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/host/application"));
    expect(requests).toEqual([
      `POST ${JSON.stringify({ acceptNotice: true, personType: "pf", cpf: SYNTHETIC_CPF, documentType: "cnh" })}`,
      "PUT documents",
      "POST submission",
    ]);
  });

  it("REQ-HVER-004 empresa pede CNPJ, razão social, nome fantasia e endereço", async () => {
    const requests = fakeApi({ application: null });
    server.use(
      http.get("https://viacep.com.br/ws/:cep/json/", () =>
        HttpResponse.json({
          cep: "87013-000",
          logradouro: "Av. Brasil",
          bairro: "Centro",
          localidade: "Maringá",
          uf: "PR",
        }),
      ),
    );
    const { user } = renderWizard("start");
    await user.click(await screen.findByRole("radio", { name: "Empresa" }));
    await user.click(screen.getByRole("checkbox", { name: copy.notice.accept }));
    await user.click(screen.getByRole("button", { name: copy.notice.next }));

    await screen.findByRole("heading", { level: 1, name: copy.data.heading });
    await user.type(screen.getByRole("textbox", { name: copy.data.cpf }), SYNTHETIC_CPF);
    await user.click(screen.getByRole("radio", { name: /RG/ }));
    await user.type(screen.getByRole("textbox", { name: copy.data.company.cnpj }), SYNTHETIC_CNPJ);
    await user.type(screen.getByRole("textbox", { name: copy.data.company.legalName }), "Pet Feliz Hospedagem LTDA");
    await user.type(screen.getByRole("textbox", { name: copy.data.company.tradeName }), "Pet Feliz");
    await user.type(screen.getByRole("textbox", { name: "CEP" }), "87013000");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Rua" })).toHaveValue("Av. Brasil"));
    await user.type(screen.getByRole("textbox", { name: "Número" }), "1500");
    await user.click(screen.getByRole("button", { name: copy.data.next }));

    await screen.findByRole("heading", { level: 1, name: copy.photos.heading });
    expect(JSON.parse(requests[0]!.replace(/^POST /, ""))).toMatchObject({
      personType: "pj",
      cnpj: SYNTHETIC_CNPJ,
      legalName: "Pet Feliz Hospedagem LTDA",
      tradeName: "Pet Feliz",
      companyAddress: { zipCode: "87013000", street: "Av. Brasil", number: "1500", city: "Maringá", state: "PR" },
    });
  });

  it("REQ-HVER-004 REQ-HVER-018 CPF inválido não sai do passo; o foco vai para o campo", async () => {
    fakeApi({ application: null });
    const { user } = renderWizard("start");
    await user.click(await screen.findByRole("checkbox", { name: copy.notice.accept }));
    await user.click(screen.getByRole("button", { name: copy.notice.next }));
    await screen.findByRole("heading", { level: 1, name: copy.data.heading });

    const cpf = screen.getByRole("textbox", { name: copy.data.cpf });
    await user.type(cpf, "52998224724");
    await user.click(screen.getByRole("button", { name: copy.data.next }));

    await waitFor(() => expect(cpf).toHaveFocus());
    expect(cpf).toHaveAccessibleDescription(expect.stringContaining(copy.data.cpfInvalid));
    expect(screen.getByText(copy.data.documentTypeMissing)).toBeInTheDocument();
  });

  it("REQ-HVER-019 CPF de outra conta (409) aparece no campo", async () => {
    fakeApi({ application: null });
    server.use(
      http.post("*/api/hosts/me/application", () =>
        HttpResponse.json(apiFail("HOST_CPF_ALREADY_REGISTERED"), { status: 409 }),
      ),
    );
    const { user } = renderWizard("start");
    await user.click(await screen.findByRole("checkbox", { name: copy.notice.accept }));
    await user.click(screen.getByRole("button", { name: copy.notice.next }));
    await screen.findByRole("heading", { level: 1, name: copy.data.heading });
    const cpf = screen.getByRole("textbox", { name: copy.data.cpf });
    await user.type(cpf, SYNTHETIC_CPF);
    await user.click(screen.getByRole("radio", { name: /CIN/ }));
    await user.click(screen.getByRole("button", { name: copy.data.next }));

    await waitFor(() =>
      expect(cpf).toHaveAccessibleDescription(
        expect.stringContaining(
          "Esse CPF já está em outra conta. Se ele é seu, fala com o suporte que a gente resolve.",
        ),
      ),
    );
    expect(cpf).toHaveFocus();
  });

  it("REQ-HVER-005 REQ-HVER-011 volta outro dia direto nas fotos; corrigir os dados manda só o que mudou", async () => {
    const requests = fakeApi({ application: hostApplicationDto() });
    const { user } = renderWizard("documents");

    await screen.findByRole("heading", { level: 1, name: copy.photos.heading });
    await user.click(screen.getByRole("button", { name: copy.photos.back }));
    await screen.findByRole("heading", { level: 1, name: copy.data.heading });
    expect(screen.getByRole("textbox", { name: copy.data.cpf })).toHaveValue("529.982.247-25");
    await user.click(screen.getByRole("radio", { name: /RG/ }));
    await user.click(screen.getByRole("button", { name: copy.data.next }));

    await screen.findByRole("heading", { level: 1, name: copy.photos.heading });
    expect(requests).toEqual([`PATCH ${JSON.stringify({ documentType: "rg" })}`]);
  });

  it("REQ-HVER-009 foto escolhida e não enviada pede confirmação ao fechar a aba", async () => {
    fakeApi({ application: hostApplicationDto() });
    const { user } = renderWizard("documents");
    await screen.findByRole("heading", { level: 1, name: copy.photos.heading });
    await user.upload(screen.getByLabelText("Foto da frente do documento: galeria"), photo("frente.jpg"));
    await screen.findByRole("button", { name: "Foto da frente do documento, foto escolhida" });

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
