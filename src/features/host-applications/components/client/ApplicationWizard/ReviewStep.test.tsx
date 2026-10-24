import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlashMessageProvider, useFlashMessageOnce } from "@/shared/hooks/useFlashMessage";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { allDocumentsDto, companyDto, hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { hostApplicationDtoSchema } from "../../../api/contracts";
import { toHostApplication } from "../../../api/toMyApplication";
import { verificationCopy as copy } from "../../../lib/verificationCopy";
import { ReviewStep } from "./ReviewStep";
import type { PhotoState } from "./DocumentsStep";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:frente");
  URL.revokeObjectURL = vi.fn();
});

const complete = { documents: allDocumentsDto, missingDocuments: [] };

function FlashProbe() {
  const message = useFlashMessageOnce();
  return <p>aviso: {message ?? "nenhum"}</p>;
}

function setup(overrides: Record<string, unknown> = complete, photos: PhotoState = {}) {
  const application = toHostApplication(hostApplicationDtoSchema.parse(hostApplicationDto(overrides)));
  const onBack = vi.fn();
  const view = renderWithProviders(
    <FlashMessageProvider>
      <ReviewStep accountId="account-1" application={application} photos={photos} onBack={onBack} />
    </FlashMessageProvider>,
    { theme: quintalTheme },
  );
  return { ...view, onBack };
}

describe("ReviewStep", () => {
  it("REQ-HVER-010 mostra as miniaturas da memória ou 'enviada', o CPF mascarado e o documento", () => {
    setup(complete, { front: { file: new File(["f"], "frente.jpg", { type: "image/jpeg" }), sent: true } });
    expect(screen.getByRole("img", { name: "Foto da frente do documento" })).toHaveAttribute("src", "blob:frente");
    expect(screen.getByText("Foto do verso do documento: enviada ✓")).toBeInTheDocument();
    expect(screen.getByText("Selfie segurando o documento: enviada ✓")).toBeInTheDocument();
    expect(screen.getByText("***.***.247-25")).toBeInTheDocument();
    expect(screen.getByText("CNH")).toBeInTheDocument();
    expect(screen.queryByText("52998224725")).not.toBeInTheDocument();
  });

  it("REQ-HVER-010 empresa mostra o nome fantasia", () => {
    setup({ ...complete, personType: "pj", company: companyDto });
    expect(screen.getByText("Pet Feliz")).toBeInTheDocument();
  });

  it("REQ-HVER-010 faltando foto, 'Enviar pra análise' fica travado e diz por quê", () => {
    setup({ missingDocuments: ["selfie"] });
    const submit = screen.getByRole("button", { name: copy.review.submit });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAccessibleDescription(copy.review.missing);
  });

  it("REQ-HVER-010 envia, deixa o aviso e volta ao status", async () => {
    server.use(
      http.post("*/api/hosts/me/application/submission", () =>
        HttpResponse.json(apiOk(hostApplicationDto({ status: "submitted", ...complete }))),
      ),
      http.get("*/api/hosts/me/application", () =>
        HttpResponse.json(apiOk(myApplicationDto({ application: hostApplicationDto({ status: "submitted" }) }))),
      ),
    );
    const { user, rerender } = setup();
    await user.click(screen.getByRole("button", { name: copy.review.submit }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/host/application"));
    rerender(
      <FlashMessageProvider>
        <FlashProbe />
      </FlashMessageProvider>,
    );
    expect(screen.getByText(`aviso: ${copy.review.sent}`)).toBeInTheDocument();
  });

  it("REQ-HVER-019 erro no envio vira a frase da PetHost", async () => {
    server.use(
      http.post("*/api/hosts/me/application/submission", () =>
        HttpResponse.json(apiFail("HOST_APPLICATION_DOCUMENTS_MISSING"), { status: 422 }),
      ),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: copy.review.submit }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ainda falta foto. Confere as três vagas antes de enviar.",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("REQ-HVER-010 'Voltar: fotos' volta um passo", async () => {
    const { user, onBack } = setup();
    await user.click(screen.getByRole("button", { name: copy.review.back }));
    expect(onBack).toHaveBeenCalled();
  });
});
