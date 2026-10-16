import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { FlashMessageProvider, useFlashMessage } from "@/shared/hooks/useFlashMessage";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { myApplicationSchema } from "../../../api/contracts";
import { myApplicationQueries } from "../../../api/queries";
import { toMyApplication } from "../../../api/toMyApplication";
import { verificationCopy } from "../../../lib/verificationCopy";
import { ApplicationStatusView } from "./ApplicationStatusView";

const copy = verificationCopy.status;
const ACCOUNT = "account-1";

beforeEach(() => localStorage.clear());

function setup(overrides: Record<string, unknown> = {}, application: Record<string, unknown> | null = null) {
  const dto = myApplicationDto({ application: application && hostApplicationDto(application), ...overrides });
  const queryClient = createTestQueryClient();
  // O cache semeado vale como recém-lido: a tela não busca de novo ao montar.
  queryClient.setQueryDefaults(myApplicationQueries.mine(ACCOUNT).queryKey, { staleTime: Infinity });
  queryClient.setQueryData(
    myApplicationQueries.mine(ACCOUNT).queryKey,
    toMyApplication(myApplicationSchema.parse(dto)),
  );
  return renderWithProviders(
    <FlashMessageProvider>
      <ApplicationStatusView accountId={ACCOUNT} />
    </FlashMessageProvider>,
    { theme: quintalTheme, queryClient },
  );
}

describe("ApplicationStatusView", () => {
  it("REQ-HVER-002 sem solicitação: explica e oferece 'Começar'", async () => {
    setup();
    expect(await screen.findByRole("heading", { name: copy.empty.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.empty.start })).toHaveAttribute("href", "/host/application/new");
  });

  it("REQ-HVER-011 rascunho: aviso de atenção com a validade e o caminho de volta", async () => {
    setup({}, { status: "draft", createdAt: "2026-10-12T15:00:00+00:00" });
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Sua verificação ficou pela metade. Ela vale até segunda-feira (19/10).");
    expect(screen.getByRole("link", { name: copy.draft.continue })).toHaveAttribute(
      "href",
      "/host/application/documents",
    );
  });

  it("REQ-HVER-012 em análise: trilha, espera e 'Desistir' discreto", async () => {
    setup({ canStartNew: false }, { status: "submitted", missingDocuments: [] });
    const timeline = await screen.findByRole("list", { name: copy.submitted.timeline });
    expect(
      within(timeline)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Enviado, feito", "Em análise, agora", "Aprovado, falta"]);
    expect(screen.getByText(copy.submitted.wait)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.cancel.open })).toBeInTheDocument();
  });

  it("REQ-HVER-013 desistir pede confirmação, avisa das fotos e volta ao começo", async () => {
    let state = hostApplicationDto({ status: "submitted", missingDocuments: [] });
    server.use(
      http.delete("*/api/hosts/me/application", () => {
        state = hostApplicationDto({ status: "cancelled", missingDocuments: [] });
        return HttpResponse.json(apiOk(state));
      }),
      http.get("*/api/hosts/me/application", () => HttpResponse.json(apiOk(myApplicationDto({ application: state })))),
    );
    const { user } = setup({ canStartNew: false }, { status: "submitted", missingDocuments: [] });
    await user.click(await screen.findByRole("button", { name: copy.cancel.open }));
    const dialog = await screen.findByRole("dialog", { name: copy.cancel.title });
    expect(dialog).toHaveAccessibleDescription(copy.cancel.message);
    await waitFor(() => expect(within(dialog).getByRole("button", { name: copy.cancel.keep })).toHaveFocus());
    await user.click(within(dialog).getByRole("button", { name: copy.cancel.confirm }));

    expect(await screen.findByRole("heading", { name: copy.closed.cancelled.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.closed.restart })).toHaveAttribute("href", "/host/application/new");
  });

  it("REQ-HVER-014 recusada: motivo, o que fazer, tentativas e 'Tentar de novo', sem tom de erro", async () => {
    setup(
      { remainingAttempts: 2 },
      { status: "rejected", rejectionReason: "document_illegible", missingDocuments: [] },
    );
    expect(await screen.findByRole("heading", { name: copy.rejected.title })).toBeInTheDocument();
    expect(
      screen.getByText("Não deu pra ler o documento. Tira a foto de dia, perto da janela, sem reflexo."),
    ).toBeInTheDocument();
    expect(screen.getByText("Você ainda tem 2 tentativas.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.rejected.retry })).toHaveAttribute("href", "/host/application/new");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("REQ-HVER-014 uma tentativa só, no singular", async () => {
    setup({ remainingAttempts: 1 }, { status: "rejected", rejectionReason: "other", missingDocuments: [] });
    expect(await screen.findByText("Você ainda tem 1 tentativa.")).toBeInTheDocument();
  });

  it.each([
    [
      "recusa definitiva",
      { canStartNew: false, remainingAttempts: 2 },
      { status: "rejected_final" },
      copy.support.blocked,
    ],
    ["sem tentativas", { canStartNew: false, remainingAttempts: 0 }, { status: "rejected" }, copy.support.noAttempts],
  ])("REQ-HVER-015 %s: frase de suporte e nada de 'Tentar de novo'", async (_, overrides, application, phrase) => {
    setup(overrides, { ...application, rejectionReason: "other", missingDocuments: [] });
    expect(await screen.findByText(phrase)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: copy.rejected.retry })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: copy.closed.restart })).not.toBeInTheDocument();
  });

  it("REQ-HVER-016 aprovada: comemora na primeira visita e só mostra o estado nas seguintes", async () => {
    const first = setup({ canStartNew: false }, { status: "approved", missingDocuments: [] });
    expect(await screen.findByRole("heading", { name: copy.approved.title })).toBeInTheDocument();
    expect(screen.getByTestId("celebracao")).toBeInTheDocument();
    first.unmount();

    setup({ canStartNew: false }, { status: "approved", missingDocuments: [] });
    expect(await screen.findByRole("heading", { name: copy.approved.title })).toBeInTheDocument();
    expect(screen.queryByTestId("celebracao")).not.toBeInTheDocument();
  });

  it.each([
    ["expired", copy.closed.expired],
    ["cancelled", copy.closed.cancelled],
  ] as const)("REQ-HVER-017 %s: explica e oferece começar de novo, sem gastar tentativa", async (status, texts) => {
    setup({}, { status, missingDocuments: [] });
    expect(await screen.findByRole("heading", { name: texts.title })).toBeInTheDocument();
    expect(screen.getByText(texts.body)).toBeInTheDocument();
    expect(screen.getByText(copy.closed.free)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.closed.restart })).toBeInTheDocument();
  });

  it("REQ-HVER-010 mostra o aviso deixado pelo envio, uma vez", async () => {
    server.use(
      http.get("*/api/hosts/me/application", () =>
        HttpResponse.json(apiOk(myApplicationDto({ application: hostApplicationDto({ status: "submitted" }) }))),
      ),
    );
    function Sender() {
      useFlashMessage().show(verificationCopy.review.sent);
      return null;
    }
    const { rerender } = renderWithProviders(
      <FlashMessageProvider>
        <Sender />
      </FlashMessageProvider>,
      { theme: quintalTheme },
    );
    rerender(
      <FlashMessageProvider>
        <ApplicationStatusView accountId={ACCOUNT} />
      </FlashMessageProvider>,
    );
    expect(await screen.findByText(verificationCopy.review.sent)).toBeInTheDocument();
  });
});
